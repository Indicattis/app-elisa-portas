import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { cpf_ultimos_4, new_password, action } = body

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
      const user = users.find(u => u.email?.toLowerCase() === body.email.toLowerCase())

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

    // Fluxo de login: validar últimos 4 dígitos do CPF
    if (!cpf_ultimos_4) {
      return new Response(
        JSON.stringify({ error: 'CPF (últimos 4 dígitos) é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato: exatamente 4 dígitos
    if (!/^\d{4}$/.test(cpf_ultimos_4)) {
      return new Response(
        JSON.stringify({ error: 'CPF deve conter exatamente 4 dígitos' }),
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

    // Buscar apenas usuários da fábrica/instalações (NÃO administradores)
    console.log('Buscando usuário com CPF terminando em:', cpf_ultimos_4)
    
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('ativo', true)
      .in('setor', ['fabrica', 'instalacoes'])
      .not('role', 'in', '("administrador","diretor","gerente_comercial","gerente_financeiro")')

    console.log('Usuários encontrados:', adminUsers?.length || 0)

    if (adminError) {
      console.error('Erro na query:', adminError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário', details: adminError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filtrar usuário pelos últimos 4 dígitos do CPF
    const adminUser = adminUsers?.find(u => {
      if (!u.cpf) return false
      // Remover qualquer formatação e pegar últimos 4 dígitos
      const cpfLimpo = u.cpf.replace(/\D/g, '')
      return cpfLimpo.slice(-4) === cpf_ultimos_4
    })

    if (!adminUser) {
      console.log('Nenhum usuário encontrado com CPF terminando em:', cpf_ultimos_4)
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não encontrado', 
          message: 'CPF não encontrado ou usuário inativo/não pertence à produção' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validação extra: verificar se não é um cargo protegido
    const rolesProtegidos = ['administrador', 'diretor', 'gerente_comercial', 'gerente_financeiro']
    if (rolesProtegidos.includes(adminUser.role)) {
      console.log('Tentativa de login bloqueada para cargo protegido:', adminUser.role)
      return new Response(
        JSON.stringify({ 
          error: 'Acesso negado', 
          message: 'Este usuário deve acessar pelo login principal em /auth' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log('[AUDIT] Configurando autenticação para:', email, '- Setor:', adminUser.setor, '- Role:', adminUser.role)

    // Tentar buscar usuário auth existente pelo email real (considerando paginação)
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listUsersError) {
      console.error('Erro ao listar usuários:', listUsersError)
    }
    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

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
            cpf_ultimos_4: cpf_ultimos_4,
            setor: adminUser.setor || 'fabrica'
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
          cpf_ultimos_4: cpf_ultimos_4,
          setor: adminUser.setor || 'fabrica'
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
        message: 'Autenticação configurada com sucesso',
        user: {
          id: adminUser.id,
          nome: adminUser.nome,
          cpf_ultimos_4: cpf_ultimos_4
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
