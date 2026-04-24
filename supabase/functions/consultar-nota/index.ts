import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapear status da Focus NFe para status do sistema
const mapearStatus = (statusFocus: string | undefined): string => {
  if (!statusFocus) return 'pendente';
  
  const statusMap: Record<string, string> = {
    'processando_autorizacao': 'processando',
    'autorizado': 'autorizada',
    'cancelado': 'cancelada',
    'erro_autorizacao': 'rejeitada',
    'rejeitado': 'rejeitada',
  };
  
  return statusMap[statusFocus] || 'pendente';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    console.log('[consultar-nota] Authorization header:', authHeader ? 'Present' : 'Missing');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { notaFiscalId } = await req.json();
    console.log('[consultar-nota] Consultando nota:', notaFiscalId);

    // Buscar nota no banco com join na empresa emissora
    const { data: nota, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .select('*, empresas_emissoras(*)')
      .eq('id', notaFiscalId)
      .single();

    if (notaError || !nota) {
      console.error('[consultar-nota] Erro ao buscar nota:', notaError);
      throw new Error('Nota fiscal não encontrada');
    }

    console.log('[consultar-nota] Nota encontrada:', nota.numero, 'ref:', nota.ref_externa);

    if (!nota.ref_externa) {
      throw new Error('Esta nota não possui referência da Focus NFe');
    }

    // Buscar token da empresa emissora vinculada à nota
    const empresa = nota.empresas_emissoras;
    if (!empresa) {
      throw new Error('Empresa emissora não encontrada para esta nota');
    }

    if (!empresa.focusnfe_token) {
      throw new Error('Token Focus NFe não configurado para a empresa emissora');
    }

    const focusToken = empresa.focusnfe_token;
    
    // Determinar URL base pelo ambiente da empresa
    const isProducao = empresa.ambiente === 'producao' || empresa.ambiente === 'production';
    const baseUrl = isProducao
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Determinar o tipo de nota
    const isNfse = nota.codigo_servico ? true : false;
    const endpoint = isNfse ? 'nfse' : 'nfe';

    const focusUrl = `${baseUrl}/v2/${endpoint}/${nota.ref_externa}`;
    console.log('[consultar-nota] Consultando Focus NFe:', focusUrl);
    console.log('[consultar-nota] Ambiente:', empresa.ambiente);

    const basicAuthHeader = 'Basic ' + btoa(focusToken + ':');

    const response = await fetch(focusUrl, {
      method: 'GET',
      headers: {
        'Authorization': basicAuthHeader,
      },
    });

    const responseText = await response.text();
    console.log('[consultar-nota] Resposta Focus NFe:', responseText);

    if (!response.ok) {
      throw new Error(`Erro ao consultar nota na Focus NFe: ${response.status} - ${responseText}`);
    }

    const focusResponse = JSON.parse(responseText);

    // Mapear status para o sistema
    const statusMapeado = mapearStatus(focusResponse.status);

    // Atualizar nota no banco
    const updateData: Record<string, any> = {
      status: statusMapeado,
      status_sefaz: statusMapeado,
    };

    // Atualizar campos se disponíveis na resposta
    if (focusResponse.numero) updateData.numero = focusResponse.numero.toString();
    if (focusResponse.chave_nfe) updateData.chave_acesso = focusResponse.chave_nfe;
    if (focusResponse.protocolo) updateData.protocolo_autorizacao = focusResponse.protocolo;
    if (focusResponse.caminho_danfe) updateData.danfe_url = focusResponse.caminho_danfe;
    if (focusResponse.caminho_xml_nota_fiscal) {
      updateData.xml_url = focusResponse.caminho_xml_nota_fiscal;
      updateData.xml_autorizado_url = focusResponse.caminho_xml_nota_fiscal;
    }
    if (focusResponse.mensagem_sefaz) updateData.motivo_rejeicao = focusResponse.mensagem_sefaz;
    if (focusResponse.status === 'autorizado') {
      updateData.data_autorizacao = new Date().toISOString();
    }

    console.log('[consultar-nota] Atualizando nota com:', updateData);

    const { data: updatedNota, error: updateError } = await supabaseClient
      .from('notas_fiscais')
      .update(updateData)
      .eq('id', notaFiscalId)
      .select()
      .single();

    if (updateError) {
      console.error('[consultar-nota] Erro ao atualizar nota:', updateError);
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
    console.error('[consultar-nota] Erro:', error);
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
