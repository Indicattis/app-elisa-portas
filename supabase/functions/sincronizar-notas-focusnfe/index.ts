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
    console.log('[sincronizar-notas] Authorization header:', authHeader ? 'Present' : 'Missing');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { empresaEmissoraId } = await req.json();
    console.log('[sincronizar-notas] Empresa emissora ID:', empresaEmissoraId);

    // Buscar empresa emissora
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas_emissoras')
      .select('*')
      .eq('id', empresaEmissoraId)
      .single();

    if (empresaError || !empresa) {
      console.error('[sincronizar-notas] Erro ao buscar empresa:', empresaError);
      throw new Error('Empresa emissora não encontrada');
    }

    if (!empresa.focusnfe_token) {
      throw new Error('Token Focus NFe não configurado para a empresa emissora');
    }

    const focusToken = empresa.focusnfe_token;
    const cnpj = empresa.cnpj.replace(/\D/g, '');
    
    // Determinar URL base pelo ambiente da empresa
    const isProducao = empresa.ambiente === 'producao' || empresa.ambiente === 'production';
    const baseUrl = isProducao
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    const basicAuthHeader = 'Basic ' + btoa(focusToken + ':');

    // Buscar NFes da Focus NFe
    const nfeUrl = `${baseUrl}/v2/nfe?cnpj_emitente=${cnpj}`;
    console.log('[sincronizar-notas] Consultando NFes:', nfeUrl);

    const nfeResponse = await fetch(nfeUrl, {
      method: 'GET',
      headers: {
        'Authorization': basicAuthHeader,
      },
    });

    if (!nfeResponse.ok) {
      const errorText = await nfeResponse.text();
      console.error('[sincronizar-notas] Erro ao buscar NFes:', errorText);
      throw new Error(`Erro ao buscar NFes da Focus NFe: ${nfeResponse.status}`);
    }

    const nfes = await nfeResponse.json();
    console.log('[sincronizar-notas] NFes encontradas:', nfes.length);

    // Buscar notas já existentes no sistema
    const { data: notasExistentes, error: notasError } = await supabaseClient
      .from('notas_fiscais')
      .select('ref_externa')
      .eq('empresa_emissora_id', empresaEmissoraId);

    if (notasError) {
      console.error('[sincronizar-notas] Erro ao buscar notas existentes:', notasError);
      throw notasError;
    }

    const refsExistentes = new Set(notasExistentes?.map(n => n.ref_externa) || []);
    console.log('[sincronizar-notas] Notas existentes no sistema:', refsExistentes.size);

    // Filtrar notas que não existem no sistema
    const notasParaImportar = nfes.filter((nfe: any) => !refsExistentes.has(nfe.ref));
    console.log('[sincronizar-notas] Notas para importar:', notasParaImportar.length);

    let importadas = 0;
    let erros = 0;

    for (const nfe of notasParaImportar) {
      try {
        // Consultar detalhes da nota na Focus NFe
        const detalheUrl = `${baseUrl}/v2/nfe/${nfe.ref}`;
        const detalheResponse = await fetch(detalheUrl, {
          method: 'GET',
          headers: {
            'Authorization': basicAuthHeader,
          },
        });

        if (!detalheResponse.ok) {
          console.error('[sincronizar-notas] Erro ao buscar detalhe da nota:', nfe.ref);
          erros++;
          continue;
        }

        const detalhe = await detalheResponse.json();
        console.log('[sincronizar-notas] Detalhe da nota:', nfe.ref, detalhe.status);

        // Criar nota no banco
        const novaNota = {
          tipo: 'nfe',
          numero: detalhe.numero?.toString() || nfe.numero?.toString() || '',
          serie: detalhe.serie?.toString() || '1',
          chave_acesso: detalhe.chave_nfe || null,
          valor_total: detalhe.valor_total || 0,
          data_emissao: new Date().toISOString().split('T')[0],
          cnpj_cpf: detalhe.cnpj_destinatario || detalhe.cpf_destinatario || '',
          razao_social: detalhe.nome_destinatario || 'Não informado',
          status: mapearStatus(detalhe.status),
          ref_externa: nfe.ref,
          protocolo_autorizacao: detalhe.protocolo || null,
          status_sefaz: mapearStatus(detalhe.status),
          motivo_rejeicao: detalhe.mensagem_sefaz || null,
          danfe_url: detalhe.caminho_danfe || null,
          xml_url: detalhe.caminho_xml_nota_fiscal || null,
          xml_autorizado_url: detalhe.caminho_xml_nota_fiscal || null,
          ambiente: empresa.ambiente || 'producao',
          empresa_emissora_id: empresaEmissoraId,
          data_autorizacao: detalhe.status === 'autorizado' ? new Date().toISOString() : null,
        };

        const { error: insertError } = await supabaseClient
          .from('notas_fiscais')
          .insert(novaNota);

        if (insertError) {
          console.error('[sincronizar-notas] Erro ao inserir nota:', nfe.ref, insertError);
          erros++;
        } else {
          console.log('[sincronizar-notas] Nota importada:', nfe.ref);
          importadas++;
        }
      } catch (err) {
        console.error('[sincronizar-notas] Erro ao processar nota:', nfe.ref, err);
        erros++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalFocusNfe: nfes.length,
        existentesNoSistema: refsExistentes.size,
        importadas,
        erros,
        message: `Sincronização concluída. ${importadas} notas importadas${erros > 0 ? `, ${erros} erros` : ''}.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[sincronizar-notas] Erro:', error);
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
