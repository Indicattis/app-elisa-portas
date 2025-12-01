import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Determinar URL base
    const baseUrl = empresa.ambiente === 'production'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    // Gerar referência única
    const refSuffix = userId ? userId.substring(0, 8) : Math.random().toString(36).substring(2, 10);
    const ref = `nfe-${Date.now()}-${refSuffix}`;

    // Determinar CPF ou CNPJ do destinatário
    const cpfCnpjLimpo = payload.cnpj_cpf.replace(/\D/g, '');
    const isCpf = cpfCnpjLimpo.length === 11;
    
    // Montar payload para Focus NFe API (estrutura flat)
    const focusPayload = {
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
      
      // Items
      items: payload.items?.map((item: any, index: number) => ({
        numero_item: index + 1,
        codigo_produto: item.codigo || `PROD${index + 1}`,
        descricao: item.descricao || 'Produto',
        cfop: parseInt(item.cfop) || 5102,
        unidade_comercial: item.unidade || 'UN',
        quantidade_comercial: item.quantidade || 1,
        valor_unitario_comercial: item.valor_unitario || 0,
        valor_unitario_tributavel: item.valor_unitario || 0,
        unidade_tributavel: item.unidade || 'UN',
        codigo_ncm: item.ncm || '00000000',
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
        cfop: 5102,
        unidade_comercial: 'UN',
        quantidade_comercial: 1,
        valor_unitario_comercial: payload.valor_total || 0,
        valor_unitario_tributavel: payload.valor_total || 0,
        unidade_tributavel: 'UN',
        codigo_ncm: '00000000',
        quantidade_tributavel: 1,
        valor_bruto: payload.valor_total || 0,
        icms_situacao_tributaria: 102,
        icms_origem: 0,
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
      }]
    };

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
      throw new Error(`Erro Focus NFe (${response.status}): ${responseText}`);
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
        status: focusResponse.status || 'processando',
        status_sefaz: focusResponse.status_sefaz || 'processando',
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
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
