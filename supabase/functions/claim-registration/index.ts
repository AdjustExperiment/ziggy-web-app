import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim_token, user_id } = await req.json();

    if (!claim_token) {
      return new Response(
        JSON.stringify({ error: 'claim_token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the invitation by claim token
    const { data: invitation, error: inviteError } = await supabase
      .from('pending_registrant_invitations')
      .select(`
        *,
        tournaments(name, start_date),
        tournament_registrations(*)
      `)
      .eq('claim_token', claim_token)
      .is('claimed_at', null)
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired invitation',
          not_found: true 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'This invitation has expired',
          expired: true 
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no user_id provided, just return the invitation details (for preview)
    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: true,
          preview: true,
          invitation: {
            name: invitation.name,
            email: invitation.email,
            tournament_name: invitation.tournaments?.name,
            tournament_date: invitation.tournaments?.start_date,
            expires_at: invitation.expires_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user's email matches the invitation email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    
    if (authError || !authUser?.user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = authUser.user.email?.toLowerCase();
    const inviteEmail = invitation.email.toLowerCase();

    if (userEmail !== inviteEmail) {
      return new Response(
        JSON.stringify({ 
          error: 'Email mismatch. Please sign in with the email this invitation was sent to.',
          email_mismatch: true,
          expected_email: inviteEmail
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the invitation as claimed
    const { error: updateInviteError } = await supabase
      .from('pending_registrant_invitations')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user_id
      })
      .eq('id', invitation.id);

    if (updateInviteError) {
      console.error('Failed to update invitation:', updateInviteError);
    }

    // Update the registration to link to this user
    if (invitation.registration_id) {
      const { error: updateRegError } = await supabase
        .from('tournament_registrations')
        .update({
          user_id: user_id,
          additional_info: {
            ...invitation.tournament_registrations?.additional_info,
            claimed_at: new Date().toISOString(),
            original_registrant_type: 'other'
          }
        })
        .eq('id', invitation.registration_id);

      if (updateRegError) {
        console.error('Failed to update registration:', updateRegError);
        return new Response(
          JSON.stringify({ error: 'Failed to claim registration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update cart item if it exists
    if (invitation.cart_item_id) {
      await supabase
        .from('cart_items')
        .update({
          is_claimed: true,
          claimed_by_user_id: user_id
        })
        .eq('id', invitation.cart_item_id);
    }

    // Add participant role to user if not exists
    await supabase
      .from('user_roles')
      .upsert({
        user_id: user_id,
        role: 'participant'
      }, { onConflict: 'user_id,role' });

    console.log(`Registration claimed: invitation=${invitation.id}, user=${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        claimed: true,
        registration_id: invitation.registration_id,
        tournament_id: invitation.tournament_id,
        tournament_name: invitation.tournaments?.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claim-registration:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
