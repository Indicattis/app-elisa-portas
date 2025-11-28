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

    // Buscar todos os usuários da fábrica/administrativo ativos
    console.log('Buscando usuário com CPF terminando em:', cpf_ultimos_4)
    
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .in('setor', ['fabrica', 'administrativo'])
      .eq('ativo', true)

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

    // Usar o email real do usuário
    if (!adminUser.email) {
      console.error('Usuário sem email cadastrado:', adminUser)
      return new Response(
        JSON.stringify({ error: 'Usuário sem email', message: 'Este usuário não possui email cadastrado. Contate o administrador.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = adminUser.email

    console.log('Usuário encontrado:', { nome: adminUser.nome, email, setor: adminUser.setor })

    // Para o login, apenas retornar o email do usuário
    // O frontend vai usar esse email para fazer signInWithPassword
    return new Response(
      JSON.stringify({ 
        success: true,
        email: email,
        message: 'Usuário encontrado',
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
