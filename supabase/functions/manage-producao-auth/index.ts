import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { codigo_usuario } = await req.json()

    if (!codigo_usuario) {
      return new Response(
        JSON.stringify({ error: 'Código de usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service_role (admin)
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

    // Buscar usuário em admin_users
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('codigo_usuario', codigo_usuario)
      .eq('setor', 'fabrica')
      .eq('ativo', true)
      .single()

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = `${codigo_usuario}@producao.local`
    const password = 'Producao@2024'

    // Tentar buscar usuário auth existente
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)

    let authUser

    if (existingUser) {
      // Atualizar senha e confirmar email
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            nome: adminUser.nome,
            codigo_usuario: codigo_usuario,
            setor: 'fabrica'
          }
        }
      )

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar credenciais' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      authUser = data.user
    } else {
      // Criar novo usuário com email já confirmado
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome: adminUser.nome,
          codigo_usuario: codigo_usuario,
          setor: 'fabrica'
        }
      })

      if (error) {
        console.error('Erro ao criar usuário:', error)
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conta' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      authUser = data.user
    }

    // Atualizar user_id em admin_users se necessário
    if (adminUser.user_id !== authUser.id) {
      await supabaseAdmin
        .from('admin_users')
        .update({ user_id: authUser.id })
        .eq('id', adminUser.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        email: email,
        message: 'Credenciais configuradas com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
