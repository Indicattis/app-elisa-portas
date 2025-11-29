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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const focusToken = Deno.env.get('FOCUSNFE_TOKEN');

    if (!focusToken) {
      throw new Error('Token da API Focus NFe não encontrado.');
    }

    const { notaFiscalId } = await req.json();
    console.log('Consultando nota:', notaFiscalId);

    // Buscar nota no banco
    const { data: nota, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .select('*')
      .eq('id', notaFiscalId)
      .single();

    if (notaError || !nota) {
      throw new Error('Nota fiscal não encontrada');
    }

    if (!nota.ref_externa) {
      throw new Error('Esta nota não possui referência da Focus NFe');
    }

    // Buscar configurações para determinar ambiente
    const { data: config } = await supabaseClient
      .from('configuracoes_fiscais')
      .select('ambiente')
      .single();

    const baseUrl = config?.ambiente === 'production'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Determinar o tipo de nota
    const isNfse = nota.codigo_servico ? true : false;
    const endpoint = isNfse ? 'nfse' : 'nfe';

    const focusUrl = `${baseUrl}/v2/${endpoint}/${nota.ref_externa}`;
    console.log('Consultando Focus NFe:', focusUrl);

    const authHeader = 'Basic ' + btoa(focusToken + ':');

    const response = await fetch(focusUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da API Focus NFe:', errorData);
      throw new Error(`Erro ao consultar nota: ${response.status} - ${errorData}`);
    }

    const focusResponse = await response.json();
    console.log('Resposta Focus NFe:', focusResponse);

    // Mapear status Focus NFe para nosso sistema
    const statusMap: Record<string, string> = {
      'processando_autorizacao': 'processando',
      'autorizado': 'autorizada',
      'erro_autorizacao': 'rejeitada',
      'cancelado': 'cancelada',
    };

    const statusSefaz = statusMap[focusResponse.status] || focusResponse.status;

    // Atualizar nota no banco
    const { data: updatedNota, error: updateError } = await supabaseClient
      .from('notas_fiscais')
      .update({
        numero: focusResponse.numero || nota.numero,
        status_sefaz: statusSefaz,
        status: statusSefaz,
        chave_acesso: focusResponse.chave_nfe || nota.chave_acesso,
        protocolo_autorizacao: focusResponse.protocolo || nota.protocolo_autorizacao,
        data_autorizacao: focusResponse.data_emissao || nota.data_autorizacao,
        danfe_url: focusResponse.caminho_danfe || nota.danfe_url,
        pdf_url: focusResponse.caminho_pdf || nota.pdf_url,
        xml_url: focusResponse.caminho_xml_nota_fiscal || nota.xml_url,
        xml_autorizado_url: focusResponse.caminho_xml_nota_fiscal || nota.xml_autorizado_url,
        motivo_rejeicao: focusResponse.mensagem_sefaz || nota.motivo_rejeicao,
      })
      .eq('id', notaFiscalId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar nota:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notaFiscal: updatedNota,
        focusResponse,
        message: 'Nota fiscal consultada com sucesso.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao consultar nota:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});