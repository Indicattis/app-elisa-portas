import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for all operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Invalid token:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check if user is admin (using admin client to bypass RLS)
    const { data: adminUser, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('role, ativo, bypass_permissions')
      .eq('user_id', user.id)
      .single();

    if (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminUser) {
      console.error('User not found in admin_users:', user.id);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminUser.ativo) {
      console.error('User is not active:', user.id);
      return new Response(
        JSON.stringify({ error: 'User account is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check bypass_permissions or allowed roles
    const allowedRoles = ['administrador', 'analista_rh', 'diretor', 'gerente_marketing', 'gerente_geral'];
    const hasPermission = adminUser.bypass_permissions === true || allowedRoles.includes(adminUser.role);
    if (!hasPermission) {
      console.error('Insufficient permissions - role:', adminUser.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified:', user.id);

    // Get request body
    const { 
      email, 
      password, 
      nome, 
      role, 
      data_nascimento,
      setor,
      salario,
      modalidade_pagamento,
      em_folha,
      cpf,
      eh_colaborador,
      tipo_usuario,
      em_teste,
      visivel_organograma
    } = await req.json();

    if (!email || !password || !nome || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin_users record
    const { error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: newUser.user.id,
        email,
        nome,
        role,
        data_nascimento: data_nascimento || null,
        ativo: true,
        setor: setor || null,
        salario: salario || null,
        modalidade_pagamento: modalidade_pagamento || 'mensal',
        em_folha: em_folha !== undefined ? em_folha : true,
        cpf: cpf || null,
        eh_colaborador: eh_colaborador !== undefined ? eh_colaborador : false,
        tipo_usuario: tipo_usuario || 'colaborador',
        em_teste: em_teste !== undefined ? em_teste : false,
        visivel_organograma: visivel_organograma !== undefined ? visivel_organograma : true,
      });

    if (insertError) {
      console.error('Error creating admin_users record:', insertError);
      // Try to delete the auth user if admin_users insert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant default access to /home route
    const { error: routeAccessError } = await supabaseAdmin
      .from('user_route_access')
      .insert({
        user_id: newUser.user.id,
        route_key: 'home',
        can_access: true,
      });

    if (routeAccessError) {
      console.error('Warning: Could not grant dashboard access:', routeAccessError);
      // Don't fail user creation if route access fails, just log it
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: newUser.user.id,
          email,
          nome,
          role,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
