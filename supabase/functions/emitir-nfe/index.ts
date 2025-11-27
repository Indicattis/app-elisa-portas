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
      throw new Error('Configurações da API NFe.io não encontradas. Por favor, configure as secrets NFEIO_API_KEY e NFEIO_COMPANY_ID.');
    }

    const payload = await req.json();
    console.log('Payload recebido para emissão NF-e:', payload);

    const { data: config } = await supabaseClient
      .from('configuracoes_fiscais')
      .select('*')
      .single();

    const ambiente = config?.ambiente || 'sandbox';

    // Montar payload para NFe.io - NF-e de produto
    const nfeioPayload = {
      buyer: {
        federalTaxNumber: payload.cnpj_cpf,
        name: payload.razao_social,
        email: payload.email || '',
        address: {
          country: 'BRA',
          postalCode: payload.cep || '',
          street: payload.endereco || '',
          number: payload.numero || '',
          district: payload.bairro || '',
          city: {
            code: config?.codigo_municipio_ibge || '',
            name: payload.cidade || '',
          },
          state: payload.uf || '',
        },
      },
      items: payload.items || [],
      natureOfOperation: payload.natureza_operacao || 'Venda de mercadoria',
    };

    const nfeioUrl = ambiente === 'production' 
      ? `https://api.nfe.io/v1/companies/${nfeioCompanyId}/productinvoices`
      : `https://api.nfe.io/v1/companies/${nfeioCompanyId}/productinvoices?sandbox=true`;

    console.log('Chamando NFe.io:', nfeioUrl);

    const response = await fetch(nfeioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nfeioApiKey}`,
      },
      body: JSON.stringify(nfeioPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da API NFe.io:', errorData);
      throw new Error(`Erro ao emitir NF-e: ${response.status} - ${errorData}`);
    }

    const nfeioResponse = await response.json();
    console.log('Resposta NFe.io:', nfeioResponse);

    const refExterna = `NFE-${Date.now()}`;
    const { data: notaFiscal, error: dbError } = await supabaseClient
      .from('notas_fiscais')
      .insert({
        tipo: 'saida',
        numero: nfeioResponse.number || 'Aguardando',
        serie: config?.serie_nfe?.toString() || '1',
        valor_total: payload.valor_total,
        data_emissao: new Date().toISOString(),
        cnpj_cpf: payload.cnpj_cpf,
        razao_social: payload.razao_social,
        status: 'pendente',
        ref_externa: refExterna,
        nfeio_id: nfeioResponse.id,
        status_sefaz: nfeioResponse.status || 'processando',
        ambiente,
        venda_id: payload.venda_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notaFiscal,
        nfeioResponse,
        message: 'NF-e enviada para processamento. Aguarde a autorização da SEFAZ.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
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
