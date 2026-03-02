import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

function gerarSenhaPorNome(nome: string): string {
  const normalizado = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const partes = normalizado.split(/\s+/).filter(Boolean)
  if (partes.length < 2) return partes[0] || 'usuario'
  return partes[0][0] + partes[partes.length - 1]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { cpf_ultimos_4, cpf_completo, new_password, action } = body

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

    // Fluxo de login: validar CPF (completo ou últimos 4 dígitos)
    const cpfParaBuscar = cpf_completo || cpf_ultimos_4
    const usandoCpfCompleto = !!cpf_completo

    if (!cpfParaBuscar) {
      return new Response(
        JSON.stringify({ error: 'CPF é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limpar CPF (remover formatação)
    const cpfLimpo = cpfParaBuscar.replace(/\D/g, '')

    // Validar formato
    if (usandoCpfCompleto) {
      if (cpfLimpo.length !== 11) {
        return new Response(
          JSON.stringify({ error: 'CPF deve conter 11 dígitos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      if (!/^\d{4}$/.test(cpf_ultimos_4)) {
        return new Response(
          JSON.stringify({ error: 'CPF deve conter exatamente 4 dígitos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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

    // Buscar todos os usuários ativos com CPF cadastrado
    console.log('Buscando usuário com CPF:', usandoCpfCompleto ? 'completo' : 'últimos 4 dígitos', cpfLimpo)
    
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('ativo', true)

    console.log('Usuários encontrados:', adminUsers?.length || 0)

    if (adminError) {
      console.error('Erro na query:', adminError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário', details: adminError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filtrar usuário pelo CPF (completo ou últimos 4 dígitos)
    const adminUser = adminUsers?.find(u => {
      if (!u.cpf) return false
      // Remover qualquer formatação
      const cpfUsuario = u.cpf.replace(/\D/g, '')
      
      if (usandoCpfCompleto) {
        // Match exato do CPF completo
        return cpfUsuario === cpfLimpo
      } else {
        // Match pelos últimos 4 dígitos
        return cpfUsuario.slice(-4) === cpfLimpo
      }
    })

    if (!adminUser) {
      console.log('Nenhum usuário encontrado com CPF:', cpfLimpo)
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não encontrado', 
          message: 'CPF não encontrado ou usuário inativo' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar o email real do usuário (com trim para remover caracteres invisíveis)
    if (!adminUser.email) {
      console.error('Usuário sem email cadastrado:', adminUser)
      return new Response(
        JSON.stringify({ error: 'Usuário sem email', message: 'Este usuário não possui email cadastrado. Contate o administrador.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = adminUser.email.trim()
    const password = gerarSenhaPorNome(adminUser.nome)

    console.log('[AUDIT] Configurando autenticação para:', email, '- Setor:', adminUser.setor, '- Role:', adminUser.role)

    // Tentar buscar usuário auth existente pelo email real (considerando paginação)
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listUsersError) {
      console.error('Erro ao listar usuários:', listUsersError)
    }
    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    let authUser
    const cpfUltimos4 = cpfLimpo.slice(-4)

    if (existingUser) {
      console.log('[AUDIT] Atualizando senha para usuário via CPF:', email, 'role:', adminUser.role)

      // Atualizar senha para TODOS os usuários que logam via CPF
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            nome: adminUser.nome,
            cpf_ultimos_4: cpfUltimos4,
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
          cpf_ultimos_4: cpfUltimos4,
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
        password: password,
        message: 'Autenticação configurada com sucesso',
        user: {
          id: adminUser.id,
          nome: adminUser.nome,
          cpf_ultimos_4: cpfUltimos4
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
