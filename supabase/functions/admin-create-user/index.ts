import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify JWT and get caller's user ID
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !caller) {
      console.error('Invalid token:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if caller has admin role
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !callerRoles) {
      console.error('Caller is not an admin:', caller.id)
      // Log failed attempt
      await supabaseAdmin.from('security_audit_logs').insert({
        user_id: caller.id,
        action: 'admin_create_user_denied',
        context: { reason: 'not_admin' }
      })
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const { email, password, firstName, lastName, role = 'user', regionNumber } = await req.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user with admin privileges
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      email_confirm: true
    })

    if (createError) {
      console.error('Auth error:', createError)
      // Log failed creation attempt
      await supabaseAdmin.from('security_audit_logs').insert({
        user_id: caller.id,
        action: 'admin_create_user_failed',
        context: { email, error: createError.message }
      })
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's profile with region if provided
    if (regionNumber) {
      await supabaseAdmin
        .from('profiles')
        .update({ region_number: regionNumber })
        .eq('user_id', authData.user.id)
    }

    // If a special role is requested, add it to user_roles
    if (role && role !== 'user') {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: authData.user.id, role })
    }

    // Log successful user creation
    await supabaseAdmin.from('security_audit_logs').insert({
      user_id: caller.id,
      action: 'admin_create_user_success',
      context: { 
        created_user_id: authData.user.id,
        email,
        role,
        regionNumber
      }
    })

    console.log(`Admin ${caller.id} created user ${authData.user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName,
          lastName,
          role,
          regionNumber
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
