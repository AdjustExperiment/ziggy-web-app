import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  userId: string;
  email?: string;
  password?: string;
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
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callingUser) {
      console.error("Failed to get calling user:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for checking roles and updating users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if calling user is an admin using the has_role function
    const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
      _user_id: callingUser.id,
      _role: "admin",
    });

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAdmin) {
      console.error("User is not an admin:", callingUser.id);
      return new Response(
        JSON.stringify({ error: "Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { userId, email, password }: UpdateUserRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email && !password) {
      return new Response(
        JSON.stringify({ error: "At least one of email or password must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${callingUser.id} updating user ${userId}. Email change: ${!!email}, Password change: ${!!password}`);

    // Build update object
    const updateData: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (email) {
      updateData.email = email;
      updateData.email_confirm = true; // Auto-confirm new email for admin-changed emails
    }
    if (password) {
      updateData.password = password;
    }

    // Update the user using admin API
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the action to security audit logs
    await adminClient.from("security_audit_logs").insert({
      user_id: userId,
      action: "admin_user_update",
      context: {
        admin_user_id: callingUser.id,
        email_changed: !!email,
        password_changed: !!password,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Successfully updated user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
