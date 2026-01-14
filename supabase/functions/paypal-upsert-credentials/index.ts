import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpsertCredentialsRequest {
  tournament_id: string;
  paypal_enabled: boolean;
  paypal_mode: "sandbox" | "production";
  paypal_client_id: string;
  paypal_client_secret?: string; // Optional - only required when enabling or changing
  test_credentials?: boolean; // If true, validate credentials with PayPal first
}

/**
 * Encrypts a string using AES-GCM with the provided key
 */
async function encryptSecret(
  plaintext: string,
  masterKeyHex: string
): Promise<{ ciphertext: string; iv: string }> {
  // Convert hex key to bytes
  const keyBytes = new Uint8Array(
    masterKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Import the key for AES-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Generate a random IV (96 bits / 12 bytes is standard for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );

  // Convert to base64 for storage
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertextBuffer))
  );
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return { ciphertext: ciphertextBase64, iv: ivBase64 };
}

/**
 * Tests PayPal credentials by requesting an OAuth token
 */
async function testPayPalCredentials(
  clientId: string,
  clientSecret: string,
  mode: "sandbox" | "production"
): Promise<{ valid: boolean; error?: string }> {
  const baseUrl =
    mode === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PayPal credential test failed:", errorText);
      return {
        valid: false,
        error: `PayPal authentication failed: ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.access_token) {
      return { valid: true };
    }

    return { valid: false, error: "No access token returned" };
  } catch (error) {
    console.error("PayPal credential test error:", error);
    return { valid: false, error: `Connection error: ${error.message}` };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const masterKey = Deno.env.get("PAYPAL_CREDENTIALS_MASTER_KEY");

    if (!masterKey || masterKey.length !== 64) {
      console.error("PAYPAL_CREDENTIALS_MASTER_KEY not configured or invalid");
      return new Response(
        JSON.stringify({
          error:
            "Server configuration error: encryption key not configured. Contact administrator.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create client with user's token to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const {
      data: { user: callingUser },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !callingUser) {
      console.error("Failed to get calling user:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: UpsertCredentialsRequest = await req.json();
    const {
      tournament_id,
      paypal_enabled,
      paypal_mode,
      paypal_client_id,
      paypal_client_secret,
      test_credentials,
    } = body;

    // Validate required fields
    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: "tournament_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (paypal_mode && !["sandbox", "production"].includes(paypal_mode)) {
      return new Response(
        JSON.stringify({ error: "paypal_mode must be 'sandbox' or 'production'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client to check permissions and write data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user can admin this tournament's payment settings
    const { data: canAdmin, error: permError } = await adminClient.rpc(
      "can_admin_tournament_payments",
      { p_tournament_id: tournament_id }
    );

    // If RPC doesn't exist or fails, fall back to checking can_admin_tournament
    let hasPermission = canAdmin;
    if (permError || canAdmin === null) {
      const { data: isGlobalAdmin } = await adminClient.rpc("has_role", {
        _user_id: callingUser.id,
        _role: "admin",
      });

      if (isGlobalAdmin) {
        hasPermission = true;
      } else {
        // Check scoped admin via tournament_admins
        const { data: tournamentAdmin } = await adminClient
          .from("tournament_admins")
          .select("id")
          .eq("tournament_id", tournament_id)
          .eq("user_id", callingUser.id)
          .single();

        hasPermission = !!tournamentAdmin;
      }
    }

    if (!hasPermission) {
      console.error(
        `User ${callingUser.id} denied access to tournament ${tournament_id} payment settings`
      );
      return new Response(
        JSON.stringify({
          error: "You do not have permission to manage this tournament's payment settings",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If enabling PayPal, validate that we have required credentials
    if (paypal_enabled) {
      if (!paypal_client_id) {
        return new Response(
          JSON.stringify({
            error: "paypal_client_id is required when enabling PayPal",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check if we need a new secret
      const { data: existingSettings } = await adminClient
        .from("tournament_payment_settings")
        .select("paypal_secret_ciphertext")
        .eq("tournament_id", tournament_id)
        .single();

      const hasExistingSecret = !!existingSettings?.paypal_secret_ciphertext;

      if (!hasExistingSecret && !paypal_client_secret) {
        return new Response(
          JSON.stringify({
            error: "paypal_client_secret is required when first enabling PayPal",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Test credentials if requested and secret provided
    if (test_credentials && paypal_client_secret) {
      const testResult = await testPayPalCredentials(
        paypal_client_id,
        paypal_client_secret,
        paypal_mode || "sandbox"
      );

      if (!testResult.valid) {
        return new Response(
          JSON.stringify({
            error: `PayPal credential test failed: ${testResult.error}`,
            test_failed: true,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`PayPal credentials validated for tournament ${tournament_id}`);
    }

    // Prepare the update data
    const updateData: Record<string, unknown> = {
      tournament_id,
      paypal_enabled: paypal_enabled ?? false,
      paypal_mode: paypal_mode || "sandbox",
      paypal_client_id: paypal_client_id || null,
      updated_by_user_id: callingUser.id,
      updated_at: new Date().toISOString(),
    };

    // Encrypt and store secret if provided
    if (paypal_client_secret) {
      const { ciphertext, iv } = await encryptSecret(
        paypal_client_secret,
        masterKey
      );
      updateData.paypal_secret_ciphertext = ciphertext;
      updateData.paypal_secret_iv = iv;
    }

    // Upsert the settings
    const { data: upsertedData, error: upsertError } = await adminClient
      .from("tournament_payment_settings")
      .upsert(updateData, {
        onConflict: "tournament_id",
        ignoreDuplicates: false,
      })
      .select("id, tournament_id, paypal_enabled, paypal_mode, paypal_client_id")
      .single();

    if (upsertError) {
      console.error("Failed to upsert payment settings:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save payment settings" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `PayPal settings updated for tournament ${tournament_id} by user ${callingUser.id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        settings: {
          id: upsertedData.id,
          tournament_id: upsertedData.tournament_id,
          paypal_enabled: upsertedData.paypal_enabled,
          paypal_mode: upsertedData.paypal_mode,
          paypal_client_id: upsertedData.paypal_client_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
