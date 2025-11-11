import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { codigo_usuario, new_password, action } = body

    // Se a ação foi atualizar senha
    if (action === 'update_password') {
      if (!body.email || !new_password) {
        return new Response(
          JSON.stringify({ error: 'Email e nova senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

      // Buscar usuário pelo email
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      const user = users.find(u => u.email === body.email)

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Atualizar senha
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: new_password }
      )

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar senha' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Senha atualizada com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fluxo original: validar código de usuário
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
    console.log('Buscando usuário com código:', codigo_usuario)
    
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('codigo_usuario', codigo_usuario)
      .eq('setor', 'fabrica')
      .eq('ativo', true)
      .maybeSingle()

    console.log('Resultado da busca:', { adminUser, adminError })

    if (adminError) {
      console.error('Erro na query:', adminError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário', details: adminError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!adminUser) {
      console.log('Usuário não encontrado com código:', codigo_usuario)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado', message: 'Código não encontrado ou usuário inativo/não pertence à produção' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar o email real do usuário
    if (!adminUser.email) {
      console.error('Usuário sem email cadastrado:', adminUser)
      return new Response(
        JSON.stringify({ error: 'Usuário sem email', message: 'Este usuário não possui email cadastrado. Contate o administrador.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = adminUser.email
    const password = 'Producao@2024'

    console.log('Configurando autenticação para email:', email)

    // Tentar buscar usuário auth existente pelo email real
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
        message: 'Credenciais configuradas com sucesso',
        user: {
          id: adminUser.id,
          nome: adminUser.nome,
          codigo: adminUser.codigo_usuario
        }
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
