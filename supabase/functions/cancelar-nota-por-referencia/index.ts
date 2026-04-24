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
    const { empresaEmissoraId, referencia, tipoNota, motivo } = await req.json();

    console.log('[cancelar-nota-por-referencia] Iniciando cancelamento:', {
      empresaEmissoraId,
      referencia,
      tipoNota,
      motivoLength: motivo?.length
    });

    // Validações
    if (!empresaEmissoraId) {
      return new Response(
        JSON.stringify({ error: 'ID da empresa emissora é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: 'Referência da nota é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tipoNota || !['nfe', 'nfse'].includes(tipoNota)) {
      return new Response(
        JSON.stringify({ error: 'Tipo da nota deve ser "nfe" ou "nfse"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!motivo || motivo.length < 15) {
      return new Response(
        JSON.stringify({ error: 'Motivo do cancelamento deve ter no mínimo 15 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados da empresa emissora
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas_emissoras')
      .select('focusnfe_token, ambiente')
      .eq('id', empresaEmissoraId)
      .single();

    if (empresaError || !empresa) {
      console.error('[cancelar-nota-por-referencia] Erro ao buscar empresa:', empresaError);
      return new Response(
        JSON.stringify({ error: 'Empresa emissora não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!empresa.focusnfe_token) {
      return new Response(
        JSON.stringify({ error: 'Token Focus NFe não configurado para esta empresa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar URL base da API Focus NFe
    const ambiente = empresa.ambiente || 'homologacao';
    const baseUrl = ambiente === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Montar URL de cancelamento baseado no tipo
    const endpoint = tipoNota === 'nfse' 
      ? `/v2/nfse/${referencia}` 
      : `/v2/nfe/${referencia}`;

    console.log('[cancelar-nota-por-referencia] Enviando cancelamento para:', `${baseUrl}${endpoint}`);

    // Fazer requisição de cancelamento
    const focusResponse = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(empresa.focusnfe_token + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ justificativa: motivo }),
    });

    const responseText = await focusResponse.text();
    console.log('[cancelar-nota-por-referencia] Resposta Focus NFe:', {
      status: focusResponse.status,
      body: responseText
    });

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    if (!focusResponse.ok) {
      // Verificar se é erro de nota não encontrada
      if (focusResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Nota não encontrada na Focus NFe. Verifique se a referência está correta.',
            details: responseData
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se é erro de nota já cancelada
      if (responseData?.codigo === 'cancelado' || responseData?.status === 'cancelado') {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Esta nota já estava cancelada na Focus NFe',
            data: responseData
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: responseData?.mensagem || responseData?.message || 'Erro ao cancelar nota na Focus NFe',
          details: responseData
        }),
        { status: focusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[cancelar-nota-por-referencia] Cancelamento realizado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Nota cancelada com sucesso na Focus NFe',
        data: responseData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cancelar-nota-por-referencia] Erro:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
