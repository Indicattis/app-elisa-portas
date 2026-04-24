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
  'nfe_nao_autorizada': 'NF-e não autorizada. O cancelamento só é possível para NFe\'s autorizadas.',
  'nao_encontrado': 'Recurso não encontrado. Verifique se a nota existe.',
  'requisicao_invalida': 'Requisição inválida. Verifique os campos obrigatórios.',
  'permissao_negada': 'CNPJ do emitente não autorizado. Verifique o cadastro no Painel API Focus NFe.',
  'certificado_vencido': 'O certificado digital do emitente está vencido. É necessário renovar.',
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
  
  // Retorna 'pendente' como fallback seguro (compatível com constraint do banco)
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
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    let userId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || null;
      } catch (e) {
        console.error('Erro ao decodificar JWT:', e);
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
    console.log('Payload recebido:', payload);

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
      console.error('Erro ao buscar empresa:', empresaError);
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

    // Número da nota manual (se informado)
    const numeroNotaManual = payload.numero_nota ? parseInt(payload.numero_nota) : undefined;
    console.log('[emitir-nfe] Número da nota manual:', numeroNotaManual || 'automático');

    // Gerar referência única (máximo 20 caracteres para o campo ref_externa)
    // Formato: nfe + últimos 10 dígitos timestamp + 6 caracteres do userId = 19 caracteres
    const refSuffix = userId ? userId.substring(0, 6) : Math.random().toString(36).substring(2, 8);
    const ref = `nfe${Date.now().toString().slice(-10)}${refSuffix}`;

    // Validar campos obrigatórios com tamanho mínimo
    if (!payload.endereco || payload.endereco.length < 2) {
      throw new Error('Logradouro do destinatário deve ter no mínimo 2 caracteres');
    }

    if (!payload.bairro || payload.bairro.length < 2) {
      throw new Error('Bairro do destinatário deve ter no mínimo 2 caracteres');
    }

    // Determinar CPF ou CNPJ do destinatário
    const cpfCnpjLimpo = payload.cnpj_cpf.replace(/\D/g, '');
    const isCpf = cpfCnpjLimpo.length === 11;
    
    // CFOP e NCM do payload (com valores padrão)
    const cfopPadrao = parseInt(payload.cfop) || 5102;
    const ncmPadrao = payload.ncm?.replace(/\D/g, '') || '00000000';

    // Montar payload para Focus NFe API (estrutura flat)
    const focusPayload: Record<string, any> = {
      // Número da nota (se informado manualmente)
      ...(numeroNotaManual && { numero: numeroNotaManual }),
      
      // Dados da operação
      natureza_operacao: payload.natureza_operacao || 'Venda de mercadoria',
      data_emissao: new Date().toISOString().split('T')[0], // Formato: YYYY-MM-DD
      data_entrada_saida: new Date().toISOString().split('T')[0],
      tipo_documento: 1,
      finalidade_emissao: 1,
      
      // Dados do EMITENTE (da empresa emissora)
      cnpj_emitente: empresa.cnpj.replace(/\D/g, ''),
      nome_emitente: empresa.razao_social,
      nome_fantasia_emitente: empresa.nome,
      logradouro_emitente: empresa.endereco,
      numero_emitente: parseInt(empresa.numero || '0') || 0,
      bairro_emitente: empresa.bairro,
      municipio_emitente: empresa.cidade,
      uf_emitente: empresa.estado,
      cep_emitente: empresa.cep.replace(/\D/g, ''),
      inscricao_estadual_emitente: empresa.inscricao_estadual?.replace(/\D/g, '') || null,
      
      // Dados do DESTINATÁRIO (cliente)
      nome_destinatario: payload.razao_social,
      cpf_destinatario: isCpf ? cpfCnpjLimpo : undefined,
      cnpj_destinatario: !isCpf ? cpfCnpjLimpo : undefined,
      telefone_destinatario: payload.telefone?.replace(/\D/g, '') || undefined,
      logradouro_destinatario: payload.endereco || '',
      numero_destinatario: payload.numero || 'S/N',
      bairro_destinatario: payload.bairro || '',
      municipio_destinatario: payload.cidade || '',
      uf_destinatario: payload.uf || '',
      cep_destinatario: parseInt(payload.cep?.replace(/\D/g, '') || '0') || 0,
      pais_destinatario: 'Brasil',
      
      // Valores
      valor_produtos: payload.valor_total || 0,
      valor_total: payload.valor_total || 0,
      valor_frete: 0,
      valor_seguro: 0,
      modalidade_frete: 9, // Sem frete
      
      // Items - usando CFOP e NCM do formulário
      items: payload.items?.map((item: any, index: number) => ({
        numero_item: index + 1,
        codigo_produto: item.codigo || `PROD${index + 1}`,
        descricao: item.descricao || 'Produto',
        cfop: parseInt(item.cfop) || cfopPadrao,
        unidade_comercial: item.unidade || 'UN',
        quantidade_comercial: item.quantidade || 1,
        valor_unitario_comercial: item.valor_unitario || 0,
        valor_unitario_tributavel: item.valor_unitario || 0,
        unidade_tributavel: item.unidade || 'UN',
        codigo_ncm: item.ncm?.replace(/\D/g, '') || ncmPadrao,
        quantidade_tributavel: item.quantidade || 1,
        valor_bruto: (item.quantidade || 1) * (item.valor_unitario || 0),
        icms_situacao_tributaria: 102,
        icms_origem: 0,
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
      })) || [{
        numero_item: 1,
        codigo_produto: 'PROD001',
        descricao: 'Produto/Serviço',
        cfop: cfopPadrao,
        unidade_comercial: 'UN',
        quantidade_comercial: 1,
        valor_unitario_comercial: payload.valor_total || 0,
        valor_unitario_tributavel: payload.valor_total || 0,
        unidade_tributavel: 'UN',
        codigo_ncm: ncmPadrao,
        quantidade_tributavel: 1,
        valor_bruto: payload.valor_total || 0,
        icms_situacao_tributaria: 102,
        icms_origem: 0,
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
      }]
    };

    // Adicionar informações adicionais se fornecidas
    if (payload.informacoes_adicionais && payload.informacoes_adicionais.trim()) {
      focusPayload.informacoes_adicionais_contribuinte = payload.informacoes_adicionais.trim().substring(0, 5000);
    }

    console.log('Payload Focus NFe:', JSON.stringify(focusPayload, null, 2));
    console.log('Token Focus NFe (mascarado):', focusToken.substring(0, 8) + '...');

    // Fazer requisição para Focus NFe API
    const focusUrl = `${baseUrl}/v2/nfe?ref=${ref}`;
    console.log('URL Focus NFe completa:', focusUrl);
    console.log('Ambiente:', empresa.ambiente);

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
    console.log('Resposta Focus NFe:', responseText);

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
        // Se não for JSON, usar texto bruto
        console.log('Resposta não é JSON válido');
      }

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

    // Salvar nota fiscal no banco
    const { data: notaFiscal, error: notaError } = await supabaseClient
      .from('notas_fiscais')
      .insert([{
        tipo: 'nfe',
        numero: focusResponse.numero || 'Pendente',
        serie: empresa.serie_nfe?.toString() || '1',
        data_emissao: new Date().toISOString(),
        cnpj_cpf: payload.cnpj_cpf,
        razao_social: payload.razao_social,
        valor_total: payload.valor_total || 0,
        status: mapearStatus(focusResponse.status),
        status_sefaz: mapearStatus(focusResponse.status_sefaz),
        ambiente: empresa.ambiente,
        api_id: focusResponse.numero || null,
        ref_externa: ref,
        chave_acesso: focusResponse.chave_nfe || null,
        danfe_url: focusResponse.caminho_danfe || null,
        pdf_url: focusResponse.caminho_pdf || null,
        xml_url: focusResponse.caminho_xml_nota_fiscal || null,
        empresa_emissora_id: empresaEmissoraId,
        venda_id: payload.venda_id || null,
        created_by: userId,
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
        message: 'NF-e emitida com sucesso via Focus NFe.',
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
        error: (error instanceof Error ? error.message : String(error)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
