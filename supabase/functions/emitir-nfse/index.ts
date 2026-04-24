import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Mapeamento de códigos de erro Focus NFe para mensagens amigáveis
const focusNfeErrorMessages: Record<string, string> = {
  'erro_validacao_schema': 'Erro na validação do XML. Verifique os dados informados.',
  'nfse_nao_autorizada': 'NFS-e não autorizada. Verifique os dados da empresa emissora.',
  'nao_encontrado': 'Recurso não encontrado. Verifique se a empresa está cadastrada no Focus NFe.',
  'requisicao_invalida': 'Requisição inválida. Verifique os campos obrigatórios.',
  'permissao_negada': 'CNPJ do emitente não autorizado. Verifique o cadastro no Painel API Focus NFe.',
  'certificado_vencido': 'O certificado digital do emitente está vencido. É necessário renovar.',
  'erro_autorizacao': 'Erro na autorização da NFS-e. Verifique os dados e tente novamente.',
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
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    console.log('[emitir-nfse] Authorization header:', authHeader ? 'Present' : 'Missing');

    // Extrair userId do JWT
    let userId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || null;
        console.log('[emitir-nfse] UserId extraído:', userId);
      } catch (e) {
        console.error('[emitir-nfse] Erro ao decodificar JWT:', e);
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const payload = await req.json();
    console.log('[emitir-nfse] Payload recebido:', JSON.stringify(payload, null, 2));

    const empresaEmissoraId = payload.empresa_emissora_id;
    if (!empresaEmissoraId) {
      throw new Error('empresa_emissora_id é obrigatório');
    }

    // Buscar dados da empresa emissora
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas_emissoras')
      .select('*')
      .eq('id', empresaEmissoraId)
      .single();

    if (empresaError || !empresa) {
      console.error('[emitir-nfse] Erro ao buscar empresa:', empresaError);
      throw new Error('Empresa emissora não encontrada');
    }

    if (!empresa.focusnfe_token) {
      throw new Error('Token Focus NFe não configurado para esta empresa');
    }

    const focusToken = empresa.focusnfe_token;

    // Determinar URL base - verificar 'producao' (pt) ou 'production' (en)
    const isProducao = empresa.ambiente === 'producao' || empresa.ambiente === 'production';
    const baseUrl = isProducao
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    console.log('[emitir-nfse] Ambiente:', empresa.ambiente, '| isProducao:', isProducao);
    console.log('[emitir-nfse] Base URL:', baseUrl);

    // Gerar referência única (máximo 20 caracteres)
    const refSuffix = userId ? userId.substring(0, 6) : Math.random().toString(36).substring(2, 8);
    const ref = `nfse${Date.now().toString().slice(-10)}${refSuffix}`;

    // Validar campos obrigatórios
    if (!payload.tomador_endereco || payload.tomador_endereco.length < 2) {
      throw new Error('Logradouro do tomador deve ter no mínimo 2 caracteres');
    }

    if (!payload.tomador_bairro || payload.tomador_bairro.length < 2) {
      throw new Error('Bairro do tomador deve ter no mínimo 2 caracteres');
    }

    // Determinar se é CPF ou CNPJ baseado no tamanho
    const cpfCnpjLimpo = payload.cnpj_cpf.replace(/\D/g, '');
    const isCpf = cpfCnpjLimpo.length === 11;
    console.log('[emitir-nfse] Documento tomador:', cpfCnpjLimpo, '| isCPF:', isCpf);

    // Determinar se é optante do Simples Nacional
    const isOptanteSimplesNacional = empresa.regime_tributario === 'simples_nacional' || 
                                      empresa.regime_tributario === '1';

    // Montar payload para Focus NFe API
    const focusPayload = {
      data_emissao: new Date().toISOString().split('T')[0],
      natureza_operacao: 1, // 1 = Tributação no município
      optante_simples_nacional: isOptanteSimplesNacional,
      prestador: {
        cnpj: empresa.cnpj.replace(/\D/g, ''),
        inscricao_municipal: empresa.inscricao_municipal || '',
        codigo_municipio: empresa.codigo_municipio_ibge || '',
      },
      tomador: {
        // Separar CPF e CNPJ em campos distintos conforme esperado pela API
        ...(isCpf ? { cpf: cpfCnpjLimpo } : { cnpj: cpfCnpjLimpo }),
        razao_social: payload.razao_social,
        email: payload.email || '',
        endereco: {
          logradouro: payload.tomador_endereco || '',
          numero: payload.tomador_numero || 'S/N',
          bairro: payload.tomador_bairro || '',
          codigo_municipio: empresa.codigo_municipio_ibge || '',
          uf: payload.tomador_uf || '',
          cep: payload.tomador_cep?.replace(/\D/g, '') || '',
        }
      },
      servico: {
        aliquota: (payload.aliquota_iss || empresa.aliquota_iss_padrao || 5) / 100,
        discriminacao: payload.descricao_servico || empresa.descricao_servico_padrao || '',
        iss_retido: false,
        // NFS-e Nacional de Caxias do Sul exige AMBOS os códigos de serviço:
        // - codigo_tributario_municipio → gera <cServ> (código municipal)
        // - item_lista_servico → gera <cLCServ> (código LC 116/2003)
        codigo_tributario_municipio: payload.codigo_servico || empresa.codigo_servico_padrao || '',
        item_lista_servico: payload.codigo_servico || empresa.codigo_servico_padrao || '',
        valor_servicos: payload.valor_total,
      }
    };

    console.log('[emitir-nfse] Payload Focus NFe:', JSON.stringify(focusPayload, null, 2));
    console.log('[emitir-nfse] Token Focus NFe (mascarado):', focusToken.substring(0, 8) + '...');

    // Fazer requisição para Focus NFe API
    const focusUrl = `${baseUrl}/v2/nfse?ref=${ref}`;
    console.log('[emitir-nfse] URL Focus NFe completa:', focusUrl);

    const basicAuthHeader = 'Basic ' + btoa(focusToken + ':');

    const response = await fetch(focusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader,
      },
      body: JSON.stringify(focusPayload),
    });

    const responseText = await response.text();
    console.log('[emitir-nfse] Resposta Focus NFe:', responseText);

    if (!response.ok) {
      let errorDetails = {
        status_http: response.status,
        status_api: 'erro_desconhecido',
        mensagem: responseText,
        erros: [] as string[],
        correcao: ''
      };

      // Tentar parsear resposta JSON
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails.status_api = errorJson.status || errorJson.status_sefaz || 'erro_desconhecido';
        errorDetails.mensagem = errorJson.mensagem || errorJson.message || responseText;
        
        // Capturar erros específicos de validação
        if (errorJson.erros && Array.isArray(errorJson.erros)) {
          errorDetails.erros = errorJson.erros.map((e: any) => 
            typeof e === 'string' ? e : (e.mensagem || e.message || JSON.stringify(e))
          );
        }
        
        // Adicionar sugestão de correção baseada no status
        errorDetails.correcao = focusNfeErrorMessages[errorDetails.status_api] || '';
      } catch (parseError) {
        console.log('[emitir-nfse] Resposta não é JSON válido');
      }

      console.error('[emitir-nfse] Erro Focus NFe:', errorDetails);

      // Retornar erro estruturado
      return new Response(
        JSON.stringify({
          success: false,
          error: errorDetails.mensagem,
          errorDetails: errorDetails,
          focusResponse: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const focusResponse = JSON.parse(responseText);
    console.log('[emitir-nfse] Resposta Focus NFe parsed:', focusResponse);

    // Salvar nota fiscal no banco
    const { data: notaFiscal, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .insert([{
        tipo: 'nfse',
        numero: focusResponse.numero || 'Pendente',
        serie: empresa.serie_nfse?.toString() || '1',
        data_emissao: new Date().toISOString(),
        cnpj_cpf: payload.cnpj_cpf,
        razao_social: payload.razao_social,
        valor_total: payload.valor_total,
        codigo_servico: payload.codigo_servico || empresa.codigo_servico_padrao,
        descricao_servico: payload.descricao_servico || empresa.descricao_servico_padrao,
        aliquota_iss: payload.aliquota_iss || empresa.aliquota_iss_padrao,
        valor_iss: payload.valor_total * ((payload.aliquota_iss || empresa.aliquota_iss_padrao || 5) / 100),
        tomador_endereco: payload.tomador_endereco,
        tomador_numero: payload.tomador_numero,
        tomador_bairro: payload.tomador_bairro,
        tomador_cidade: payload.tomador_cidade,
        tomador_uf: payload.tomador_uf,
        tomador_cep: payload.tomador_cep,
        status: mapearStatus(focusResponse.status),
        status_sefaz: mapearStatus(focusResponse.status_sefaz),
        ambiente: empresa.ambiente,
        api_id: focusResponse.numero || null,
        ref_externa: ref,
        chave_acesso: focusResponse.chave_nfe || null,
        pdf_url: focusResponse.caminho_pdf || null,
        xml_url: focusResponse.caminho_xml_nota_fiscal || null,
        empresa_emissora_id: empresaEmissoraId,
        venda_id: payload.venda_id || null,
        created_by: userId,
      }])
      .select()
      .single();

    if (notaError) {
      console.error('[emitir-nfse] Erro ao salvar nota:', notaError);
      throw notaError;
    }

    console.log('[emitir-nfse] Nota fiscal salva:', notaFiscal?.id);

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
    console.error('[emitir-nfse] Erro ao emitir NFS-e:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : String(error)),
        errorDetails: null,
        focusResponse: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
