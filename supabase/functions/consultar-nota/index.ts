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

    const nfeioApiKey = Deno.env.get('NFEIO_API_KEY');
    const nfeioCompanyId = Deno.env.get('NFEIO_COMPANY_ID');

    if (!nfeioApiKey || !nfeioCompanyId) {
      throw new Error('Configurações da API NFe.io não encontradas.');
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

    if (!nota.nfeio_id) {
      throw new Error('Esta nota não possui ID da NFe.io');
    }

    // Determinar o tipo de nota
    const isNfse = nota.codigo_servico ? true : false;
    const endpoint = isNfse ? 'serviceinvoices' : 'productinvoices';

    const nfeioUrl = `https://api.nfe.io/v1/companies/${nfeioCompanyId}/${endpoint}/${nota.nfeio_id}`;

    console.log('Consultando NFe.io:', nfeioUrl);

    const response = await fetch(nfeioUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nfeioApiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da API NFe.io:', errorData);
      throw new Error(`Erro ao consultar nota: ${response.status}`);
    }

    const nfeioResponse = await response.json();
    console.log('Resposta NFe.io:', nfeioResponse);

    // Atualizar dados no banco
    const updateData: any = {
      status_sefaz: nfeioResponse.status,
      numero: nfeioResponse.number || nota.numero,
    };

    if (nfeioResponse.status === 'Issued') {
      updateData.status = 'emitida';
      updateData.status_sefaz = 'autorizada';
      updateData.data_autorizacao = new Date().toISOString();
      updateData.protocolo_autorizacao = nfeioResponse.authorizationProtocol;
    } else if (nfeioResponse.status === 'Cancelled') {
      updateData.status = 'cancelada';
      updateData.status_sefaz = 'cancelada';
    } else if (nfeioResponse.status === 'Rejected') {
      updateData.status_sefaz = 'rejeitada';
      updateData.motivo_rejeicao = nfeioResponse.rejectionReason || 'Rejeitada pela SEFAZ/Prefeitura';
    }

    // URLs de arquivos
    if (nfeioResponse.pdfUrl) {
      updateData.danfe_url = nfeioResponse.pdfUrl;
      updateData.pdf_url = nfeioResponse.pdfUrl;
    }
    if (nfeioResponse.xmlUrl) {
      updateData.xml_autorizado_url = nfeioResponse.xmlUrl;
      updateData.xml_url = nfeioResponse.xmlUrl;
    }

    const { data: updatedNota, error: updateError } = await supabaseClient
      .from('notas_fiscais')
      .update(updateData)
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
        nfeioResponse,
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
