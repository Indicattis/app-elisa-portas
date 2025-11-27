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

    // Verificar autenticação
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
    console.log('Payload recebido para emissão NFS-e:', payload);

    // Buscar configurações fiscais
    const { data: config } = await supabaseClient
      .from('configuracoes_fiscais')
      .select('*')
      .single();

    const ambiente = config?.ambiente || 'sandbox';

    // Montar payload para NFe.io
    const nfeioPayload = {
      borrower: {
        federalTaxNumber: payload.cnpj_cpf,
        name: payload.razao_social,
        email: payload.email || '',
        address: {
          country: 'BRA',
          postalCode: payload.tomador_cep || '',
          street: payload.tomador_endereco || '',
          number: payload.tomador_numero || '',
          additionalInformation: '',
          district: payload.tomador_bairro || '',
          city: {
            code: config?.codigo_municipio_ibge || '',
            name: payload.tomador_cidade || '',
          },
          state: payload.tomador_uf || '',
        },
      },
      cityServiceCode: payload.codigo_servico || config?.codigo_servico_padrao,
      description: payload.descricao_servico,
      servicesAmount: payload.valor_total,
      issTax: payload.aliquota_iss || config?.aliquota_iss_padrao || 5,
    };

    // Chamar API NFe.io
    const nfeioUrl = ambiente === 'production' 
      ? `https://api.nfe.io/v1/companies/${nfeioCompanyId}/serviceinvoices`
      : `https://api.nfe.io/v1/companies/${nfeioCompanyId}/serviceinvoices?sandbox=true`;

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
      throw new Error(`Erro ao emitir NFS-e: ${response.status} - ${errorData}`);
    }

    const nfeioResponse = await response.json();
    console.log('Resposta NFe.io:', nfeioResponse);

    // Salvar nota no banco com referência NFe.io
    const refExterna = `NFSE-${Date.now()}`;
    const { data: notaFiscal, error: dbError } = await supabaseClient
      .from('notas_fiscais')
      .insert({
        tipo: 'saida',
        numero: nfeioResponse.number || 'Aguardando',
        serie: config?.serie_nfse?.toString() || '1',
        valor_total: payload.valor_total,
        data_emissao: new Date().toISOString(),
        cnpj_cpf: payload.cnpj_cpf,
        razao_social: payload.razao_social,
        status: 'pendente',
        ref_externa: refExterna,
        nfeio_id: nfeioResponse.id,
        status_sefaz: nfeioResponse.status || 'processando',
        ambiente,
        codigo_servico: payload.codigo_servico,
        descricao_servico: payload.descricao_servico,
        aliquota_iss: payload.aliquota_iss,
        valor_iss: (payload.valor_total * (payload.aliquota_iss || 5)) / 100,
        tomador_endereco: payload.tomador_endereco,
        tomador_numero: payload.tomador_numero,
        tomador_bairro: payload.tomador_bairro,
        tomador_cidade: payload.tomador_cidade,
        tomador_uf: payload.tomador_uf,
        tomador_cep: payload.tomador_cep,
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
        message: 'NFS-e enviada para processamento. Aguarde a autorização da prefeitura.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao emitir NFS-e:', error);
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
