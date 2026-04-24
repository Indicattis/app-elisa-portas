import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    console.log('[cancelar-nota] Authorization header:', authHeader ? 'Present' : 'Missing');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { notaFiscalId, motivo } = await req.json();
    console.log('[cancelar-nota] Cancelando nota:', notaFiscalId, 'Motivo:', motivo);

    // Validar motivo (Focus NFe exige mínimo 15 caracteres)
    if (!motivo || motivo.length < 15) {
      throw new Error('Motivo do cancelamento deve ter no mínimo 15 caracteres');
    }

    // Buscar nota no banco com empresa emissora
    const { data: nota, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .select('*, empresas_emissoras(*)')
      .eq('id', notaFiscalId)
      .single();

    if (notaError || !nota) {
      console.error('[cancelar-nota] Erro ao buscar nota:', notaError);
      throw new Error('Nota fiscal não encontrada');
    }

    console.log('[cancelar-nota] Nota encontrada:', nota.numero, 'Ref:', nota.ref_externa);

    if (!nota.ref_externa) {
      throw new Error('Esta nota não possui referência da Focus NFe');
    }

    if (nota.status_sefaz !== 'autorizada') {
      throw new Error(`Apenas notas autorizadas podem ser canceladas. Status atual: ${nota.status_sefaz}`);
    }

    // Buscar token e ambiente da empresa emissora
    let focusToken: string;
    let ambiente: string;

    if (nota.empresas_emissoras) {
      focusToken = nota.empresas_emissoras.focusnfe_token;
      ambiente = nota.empresas_emissoras.ambiente || 'producao';
    } else if (nota.empresa_emissora_id) {
      // Fallback: buscar empresa emissora separadamente
      const { data: empresa, error: empresaError } = await supabaseClient
        .from('empresas_emissoras')
        .select('*')
        .eq('id', nota.empresa_emissora_id)
        .single();

      if (empresaError || !empresa) {
        throw new Error('Empresa emissora não encontrada');
      }
      
      focusToken = empresa.focusnfe_token;
      ambiente = empresa.ambiente || 'producao';
    } else {
      // Fallback: usar configurações fiscais ou env
      const { data: config } = await supabaseClient
        .from('configuracoes_fiscais')
        .select('ambiente')
        .single();
      
      focusToken = Deno.env.get('FOCUSNFE_TOKEN') || '';
      ambiente = config?.ambiente || 'producao';
    }

    if (!focusToken) {
      throw new Error('Token da API Focus NFe não configurado para a empresa emissora');
    }

    console.log('[cancelar-nota] Ambiente:', ambiente);

    // Determinar URL base pelo ambiente
    const isProducao = ambiente === 'producao' || ambiente === 'production';
    const baseUrl = isProducao
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Determinar o tipo de nota
    const isNfse = nota.tipo === 'nfse' || nota.codigo_servico ? true : false;
    const endpoint = isNfse ? 'nfse' : 'nfe';

    const focusUrl = `${baseUrl}/v2/${endpoint}/${nota.ref_externa}`;
    console.log('[cancelar-nota] Cancelando na Focus NFe:', focusUrl);

    const basicAuthHeader = 'Basic ' + btoa(focusToken + ':');

    const response = await fetch(focusUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader,
      },
      body: JSON.stringify({
        justificativa: motivo,
      }),
    });

    const responseText = await response.text();
    console.log('[cancelar-nota] Resposta Focus NFe:', response.status, responseText);

    if (!response.ok) {
      let errorMessage = `Erro ao cancelar nota: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.mensagem || errorJson.erro || errorJson.message || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    let focusResponse = {};
    try {
      focusResponse = JSON.parse(responseText);
    } catch {
      focusResponse = { raw: responseText };
    }

    // Atualizar status no banco
    const { data: updatedNota, error: updateError } = await supabaseClient
      .from('notas_fiscais')
      .update({
        status: 'cancelada',
        status_sefaz: 'cancelada',
        observacoes: `Cancelada em ${new Date().toLocaleString('pt-BR')}: ${motivo}`,
      })
      .eq('id', notaFiscalId)
      .select()
      .single();

    if (updateError) {
      console.error('[cancelar-nota] Erro ao atualizar nota:', updateError);
      // Nota foi cancelada na Focus, mas erro ao atualizar localmente
    }

    return new Response(
      JSON.stringify({
        success: true,
        notaFiscal: updatedNota || nota,
        focusResponse,
        message: 'Nota fiscal cancelada com sucesso.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[cancelar-nota] Erro:', error);
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : String(error)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
