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
      throw new Error('Token da API Focus NFe não encontrado. Configure a secret FOCUSNFE_TOKEN.');
    }

    const payload = await req.json();
    console.log('Payload recebido:', payload);

    // Buscar configurações fiscais
    const { data: config, error: configError } = await supabaseClient
      .from('configuracoes_fiscais')
      .select('*')
      .single();

    if (configError) {
      console.error('Erro ao buscar configurações:', configError);
      throw new Error('Configurações fiscais não encontradas');
    }

    // Determinar URL base (homologação ou produção)
    const baseUrl = config.ambiente === 'production'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Gerar referência única
    const ref = `nfse-${Date.now()}-${user.id.substring(0, 8)}`;

    // Montar payload para Focus NFe API
    const focusPayload = {
      data_emissao: new Date().toISOString().split('T')[0],
      prestador: {
        cnpj: config.inscricao_estadual || '',
        inscricao_municipal: config.inscricao_municipal || '',
        codigo_municipio: config.codigo_municipio_ibge || '',
      },
      tomador: {
        cpf_cnpj: payload.cnpj_cpf.replace(/\D/g, ''),
        razao_social: payload.razao_social,
        email: payload.email || '',
        endereco: {
          logradouro: payload.tomador_endereco || '',
          numero: payload.tomador_numero || 'S/N',
          bairro: payload.tomador_bairro || '',
          codigo_municipio: config.codigo_municipio_ibge || '',
          uf: payload.tomador_uf || '',
          cep: payload.tomador_cep?.replace(/\D/g, '') || '',
        }
      },
      servico: {
        aliquota: (payload.aliquota_iss || config.aliquota_iss_padrao || 5) / 100,
        discriminacao: payload.descricao_servico || config.descricao_servico_padrao || '',
        iss_retido: false,
        item_lista_servico: payload.codigo_servico || config.codigo_servico_padrao || '',
        codigo_tributacao_municipio: payload.codigo_servico || config.codigo_servico_padrao || '',
        valor_servicos: payload.valor_total,
      }
    };

    console.log('Payload Focus NFe:', JSON.stringify(focusPayload, null, 2));

    // Fazer requisição para Focus NFe API
    const focusUrl = `${baseUrl}/v2/nfse?ref=${ref}`;
    console.log('URL Focus NFe:', focusUrl);

    const authHeader = 'Basic ' + btoa(focusToken + ':');

    const response = await fetch(focusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(focusPayload),
    });

    const responseText = await response.text();
    console.log('Resposta Focus NFe:', responseText);

    if (!response.ok) {
      throw new Error(`Erro Focus NFe (${response.status}): ${responseText}`);
    }

    const focusResponse = JSON.parse(responseText);

    // Salvar nota fiscal no banco
    const { data: notaFiscal, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .insert([{
        tipo: 'nfse',
        numero: focusResponse.numero || 'Pendente',
        serie: config.serie_nfse?.toString() || '1',
        data_emissao: new Date().toISOString(),
        cnpj_cpf: payload.cnpj_cpf,
        razao_social: payload.razao_social,
        valor_total: payload.valor_total,
        codigo_servico: payload.codigo_servico || config.codigo_servico_padrao,
        descricao_servico: payload.descricao_servico || config.descricao_servico_padrao,
        aliquota_iss: payload.aliquota_iss || config.aliquota_iss_padrao,
        valor_iss: payload.valor_total * ((payload.aliquota_iss || config.aliquota_iss_padrao || 5) / 100),
        tomador_endereco: payload.tomador_endereco,
        tomador_numero: payload.tomador_numero,
        tomador_bairro: payload.tomador_bairro,
        tomador_cidade: payload.tomador_cidade,
        tomador_uf: payload.tomador_uf,
        tomador_cep: payload.tomador_cep,
        status: focusResponse.status || 'processando',
        status_sefaz: focusResponse.status_sefaz || 'processando',
        ambiente: config.ambiente,
        api_id: focusResponse.numero || null,
        ref_externa: ref,
        chave_acesso: focusResponse.chave_nfe || null,
        pdf_url: focusResponse.caminho_pdf || null,
        xml_url: focusResponse.caminho_xml_nota_fiscal || null,
        created_by: user.id,
      }])
      .select()
      .single();

    if (notaError) {
      console.error('Erro ao salvar nota:', notaError);
      throw notaError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notaFiscal,
        focusResponse,
        message: 'NFS-e emitida com sucesso via Focus NFe.',
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