import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

function gerarSenhaPadrao(nome: string): string {
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar todos os usuários ativos com user_id
    const { data: adminUsers, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, nome, email, user_id')
      .eq('ativo', true)

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários', details: (error instanceof Error ? error.message : String(error)) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: { nome: string; email: string; senha: string; success: boolean; error?: string }[] = []

    for (const user of adminUsers || []) {
      const senha = gerarSenhaPadrao(user.nome)
      
      try {
        if (!user.user_id) {
          results.push({ nome: user.nome, email: user.email, senha, success: false, error: 'Sem user_id' })
          continue
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.user_id,
          { password: senha }
        )

        if (updateError) {
          results.push({ nome: user.nome, email: user.email, senha, success: false, error: updateError.message })
        } else {
          results.push({ nome: user.nome, email: user.email, senha, success: true })
        }
      } catch (err) {
        results.push({ nome: user.nome, email: user.email, senha, success: false, error: String(err) })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Senhas redefinidas: ${successCount} sucesso, ${failCount} falha(s)`,
        total: results.length,
        successCount,
        failCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
