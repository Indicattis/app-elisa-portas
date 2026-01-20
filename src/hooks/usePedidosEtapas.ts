import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EtapaPedido, PedidoEtapa, PedidoCheckbox } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";

// Função auxiliar para criar ordens de produção usando SECURITY DEFINER
async function criarOrdensProducao(pedidoId: string) {
  console.log('[criarOrdensProducao] Iniciando criação de ordens para pedido:', pedidoId);
  
  try {
    // Usar função SECURITY DEFINER para contornar políticas RLS
    const { error } = await supabase.rpc('criar_ordens_producao_automaticas', {
      p_pedido_id: pedidoId
    });

    if (error) {
      console.error('[criarOrdensProducao] Erro ao criar ordens:', error);
      throw error;
    }

    console.log('[criarOrdensProducao] Todas as ordens criadas com sucesso!');
  } catch (error) {
    console.error('[criarOrdensProducao] Erro geral:', error);
    throw error;
  }
}

// Hook para buscar contadores de todas as etapas
export function usePedidosContadores() {
  const { data: contadores = {} } = useQuery({
    queryKey: ['pedidos-contadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select('etapa_atual')
        .eq('arquivado', false);

      if (error) throw error;

      const counts: Record<EtapaPedido, number> = {
        aberto: 0,
        em_producao: 0,
        inspecao_qualidade: 0,
        aguardando_pintura: 0,
        aguardando_coleta: 0,
        aguardando_instalacao: 0,
        finalizado: 0,
      };

      data?.forEach((pedido) => {
        const etapa = pedido.etapa_atual as EtapaPedido;
        if (etapa in counts) {
          counts[etapa]++;
        }
      });

      return counts;
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  return contadores;
}

export function usePedidosEtapas(etapa?: EtapaPedido) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar pedidos por etapa
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-etapas', etapa],
    queryFn: async () => {
      // Buscar pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas:venda_id (
            id,
            cliente_nome,
            cliente_telefone,
            valor_venda,
            created_at,
            tipo_entrega,
            atendente_id,
            atendente:admin_users!fk_vendas_atendente (
              nome,
              foto_perfil_url
            ),
            produtos_vendas (
              id,
              tipo_produto,
              valor_pintura,
              largura,
              altura,
              tamanho,
              quantidade,
              cor:catalogo_cores (nome, codigo_hex)
            )
          ),
          pedidos_etapas (*)
        `)
        .eq('etapa_atual', etapa)
        .eq('arquivado', false)
        .order('prioridade_etapa', { ascending: false })
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;
      if (!pedidosData) return [];

      // Buscar informações de backlog e ordens para cada pedido
      const pedidosComBacklog = await Promise.all(
        pedidosData.map(async (pedido) => {
          // Buscar backlog
          const { data: backlogData } = await supabase
            .from('pedidos_backlog_ativo')
            .select('*')
            .eq('pedido_id', pedido.id)
            .maybeSingle();

          // Verificar se há histórico de backlog nas movimentações
          const { data: historicoBacklog } = await supabase
            .from('pedidos_movimentacoes')
            .select('id')
            .eq('pedido_id', pedido.id)
            .eq('teor', 'backlog')
            .limit(1)
            .maybeSingle();

          // Buscar status das ordens de produção
          const [soldagem, perfiladeira, separacao, qualidade, pintura] = await Promise.all([
            supabase
              .from('ordens_soldagem')
              .select('id, status, responsavel_id, pausada, justificativa_pausa')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_perfiladeira')
              .select('id, status, responsavel_id, pausada, justificativa_pausa')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_separacao')
              .select('id, status, responsavel_id, pausada, justificativa_pausa')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_qualidade')
              .select('id, status, responsavel_id, pausada, justificativa_pausa')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_pintura')
              .select('id, status, responsavel_id, pausada, justificativa_pausa')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
          ]);

          // Função auxiliar para buscar foto e nome do responsável pelo user_id
          const fetchResponsavelInfo = async (responsavelId: string | null): Promise<{ foto: string | null; nome: string | null }> => {
            if (!responsavelId) return { foto: null, nome: null };
            
            const { data } = await supabase
              .from('admin_users')
              .select('foto_perfil_url, nome')
              .eq('user_id', responsavelId)
              .maybeSingle();
            
            return {
              foto: data?.foto_perfil_url || null,
              nome: data?.nome || null,
            };
          };

          // Função auxiliar para buscar linhas concluídas de uma ordem
          const fetchLinhasConcluidas = async (
            ordemId: string | null, 
            tipoOrdem: string
          ): Promise<Array<{ item: string; quantidade: number; tamanho: string | null }>> => {
            if (!ordemId) return [];
            
            const { data } = await supabase
              .from('linhas_ordens')
              .select('item, quantidade, tamanho')
              .eq('ordem_id', ordemId)
              .eq('tipo_ordem', tipoOrdem)
              .eq('concluida', true)
              .order('concluida_em', { ascending: true });
            
            return data || [];
          };

          // Função auxiliar para buscar TODAS as linhas de perfiladeira (para cálculo de metragem)
          const fetchLinhasPerfiladeira = async (
            ordemId: string | null
          ): Promise<Array<{ quantidade: number; tamanho: string | null }>> => {
            if (!ordemId) return [];
            
            const { data } = await supabase
              .from('linhas_ordens')
              .select('quantidade, tamanho')
              .eq('ordem_id', ordemId)
              .eq('tipo_ordem', 'perfiladeira');
            
            return data || [];
          };

          const buildOrdemStatus = async (result: any, tipoOrdem: string) => {
            const responsavelId = result.data?.responsavel_id || null;
            const ordemId = result.data?.id || null;
            
            const [responsavelInfo, linhasConcluidas] = await Promise.all([
              fetchResponsavelInfo(responsavelId),
              fetchLinhasConcluidas(ordemId, tipoOrdem),
            ]);
            
            return {
              existe: !!result.data,
              ordem_id: ordemId,
              tipo_ordem: tipoOrdem,
              status: result.data?.status || null,
              capturada: !!responsavelId,
              capturada_por_foto: responsavelInfo.foto,
              capturada_por_nome: responsavelInfo.nome,
              linhas_concluidas: linhasConcluidas,
              pausada: result.data?.pausada || false,
              justificativa_pausa: result.data?.justificativa_pausa || null,
            };
          };

          const [ordemSoldagem, ordemPerfiladeira, ordemSeparacao, ordemQualidade, ordemPintura] = await Promise.all([
            buildOrdemStatus(soldagem, 'soldagem'),
            buildOrdemStatus(perfiladeira, 'perfiladeira'),
            buildOrdemStatus(separacao, 'separacao'),
            buildOrdemStatus(qualidade, 'qualidade'),
            buildOrdemStatus(pintura, 'pintura'),
          ]);

          // Buscar linhas de perfiladeira para cálculo de metragem linear
          const linhasPerfiladeira = await fetchLinhasPerfiladeira(perfiladeira.data?.id || null);

          return {
            ...pedido,
            backlog: backlogData ? [backlogData] : [],
            tem_historico_backlog: !!historicoBacklog,
            linhas_perfiladeira: linhasPerfiladeira,
            ordens: {
              soldagem: ordemSoldagem,
              perfiladeira: ordemPerfiladeira,
              separacao: ordemSeparacao,
              qualidade: ordemQualidade,
              pintura: ordemPintura,
            }
          };
        })
      );

      return pedidosComBacklog;
    },
  });

  // Buscar etapa atual de um pedido
  const getEtapaAtual = async (pedidoId: string): Promise<PedidoEtapa | null> => {
    const { data, error } = await supabase
      .from('pedidos_etapas')
      .select('*')
      .eq('pedido_id', pedidoId)
      .is('data_saida', null)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      checkboxes: (data.checkboxes as any) || []
    } as PedidoEtapa;
  };

  // Atualizar checkbox
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      checkboxId 
    }: { 
      pedidoId: string; 
      checkboxId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const etapaAtual = await getEtapaAtual(pedidoId);
      if (!etapaAtual) throw new Error('Etapa atual não encontrada');

      const checkboxes = etapaAtual.checkboxes.map(cb => 
        cb.id === checkboxId 
          ? { 
              ...cb, 
              checked: !cb.checked,
              checked_at: !cb.checked ? new Date().toISOString() : undefined,
              checked_by: !cb.checked ? user.id : undefined
            }
          : cb
      );

      const { error } = await supabase
        .from('pedidos_etapas')
        .update({ checkboxes: checkboxes as any })
        .eq('id', etapaAtual.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar checkbox:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o checkbox",
        variant: "destructive"
      });
    }
  });

  // Mover para próxima etapa
  const moverParaProximaEtapa = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      skipCheckboxValidation = false,
      onProgress
    }: { 
      pedidoId: string; 
      skipCheckboxValidation?: boolean;
      onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void;
    }) => {
      // Helper para executar com delay mínimo de 0,5 segundos
      const executarComDelay = async (fn: () => Promise<void>, minDelay = 500) => {
        const start = Date.now();
        await fn();
        const elapsed = Date.now() - start;
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
      };
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar pedido atual
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('etapa_atual')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const etapaAtualNome = pedido.etapa_atual as EtapaPedido;
      let proximaEtapa = getProximaEtapa(etapaAtualNome);

      if (!proximaEtapa) {
        throw new Error('Pedido já está na última etapa');
      }

      // Se está na etapa "aberto", validar se tem linhas cadastradas e observações da visita
      if (etapaAtualNome === 'aberto') {
        const { data: linhas, error: linhasError } = await supabase
          .from('pedido_linhas')
          .select('id')
          .eq('pedido_id', pedidoId);
        
        if (linhasError) throw linhasError;
        
        if (!linhas || linhas.length === 0) {
          throw new Error('O pedido precisa ter ao menos uma linha cadastrada antes de iniciar a produção');
        }

        // Validar observações da visita técnica para todas as portas de enrolar
        const { data: pedidoData } = await supabase
          .from('pedidos_producao')
          .select('venda_id')
          .eq('id', pedidoId)
          .single();

        if (pedidoData?.venda_id) {
          // Buscar portas de enrolar
          const { data: portasEnrolar } = await supabase
            .from('produtos_vendas')
            .select('id')
            .eq('venda_id', pedidoData.venda_id)
            .eq('tipo_produto', 'porta_enrolar');

          if (portasEnrolar && portasEnrolar.length > 0) {
            // Verificar se todas as portas têm observações com responsável preenchido
            const { data: observacoes } = await supabase
              .from('pedido_porta_observacoes')
              .select('produto_venda_id, responsavel_medidas_id')
              .eq('pedido_id', pedidoId);

            for (const porta of portasEnrolar) {
              const obs = observacoes?.find(o => o.produto_venda_id === porta.id);
              if (!obs || !obs.responsavel_medidas_id) {
                throw new Error('Preencha o responsável pelas medidas em todas as portas antes de iniciar a produção');
              }
            }
          }
        }
      }

      // Se está em aguardando_coleta ou aguardando_instalacao, validar ordem de carregamento
      if (etapaAtualNome === 'aguardando_coleta' || etapaAtualNome === 'aguardando_instalacao') {
        // Verificar se existe ordem de carregamento e se está concluída
        const { data: ordemCarregamento, error: ordemError } = await supabase
          .from('ordens_carregamento')
          .select('id, carregamento_concluido, data_carregamento, status')
          .eq('pedido_id', pedidoId)
          .maybeSingle();
        
        if (ordemError) throw ordemError;
        
        if (!ordemCarregamento) {
          throw new Error('Ordem de carregamento não encontrada para este pedido');
        }
        
        if (!ordemCarregamento.data_carregamento) {
          throw new Error('Informe a data de carregamento antes de finalizar o pedido');
        }
        
        if (!ordemCarregamento.carregamento_concluido) {
          throw new Error('O carregamento deve ser concluído antes de finalizar o pedido');
        }
      }

      // Validar checkboxes obrigatórios (apenas se não for avanço automático)
      // Para etapa "em_producao", não validar checkboxes (apenas ordens concluídas)
      const etapaAtual = await getEtapaAtual(pedidoId);
      if (etapaAtual) {
        if (!skipCheckboxValidation && etapaAtualNome !== 'em_producao') {
          const checkboxesObrigatorios = etapaAtual.checkboxes.filter(cb => cb.required);
          const todosChecados = checkboxesObrigatorios.every(cb => cb.checked);

          if (!todosChecados) {
            throw new Error('Todos os checkboxes obrigatórios devem ser marcados');
          }
        }

      // Fechar etapa atual
        if (onProgress) onProgress('fechar_etapa_atual', 'in_progress');
        await executarComDelay(async () => {
          await supabase
            .from('pedidos_etapas')
            .update({ data_saida: new Date().toISOString() })
            .eq('id', etapaAtual.id);
        });
        if (onProgress) onProgress('fechar_etapa_atual', 'completed');
      }

      // ===== CALCULAR ETAPA DESTINO ANTES DE CRIAR A NOVA ETAPA =====
      // Lógica condicional quando sai da inspeção de qualidade
      let etapaDestino = proximaEtapa;
      if (etapaAtualNome === 'inspecao_qualidade') {
        // Buscar venda associada ao pedido
        const { data: pedidoData } = await supabase
          .from('pedidos_producao')
          .select('venda_id')
          .eq('id', pedidoId)
          .single();
        
        if (pedidoData?.venda_id) {
          // Verificar se tem pintura
          const { data: produtosComPintura } = await supabase
            .from('produtos_vendas')
            .select('id')
            .eq('venda_id', pedidoData.venda_id)
            .gt('valor_pintura', 0)
            .limit(1);
          
          if (produtosComPintura && produtosComPintura.length > 0) {
            // Tem pintura → avançar para aguardando_pintura
            etapaDestino = 'aguardando_pintura';
          } else {
            // Não tem pintura → verificar tipo de entrega
            const { data: venda } = await supabase
              .from('vendas')
              .select('tipo_entrega')
              .eq('id', pedidoData.venda_id)
              .single();
            
            if (venda?.tipo_entrega === 'entrega') {
              etapaDestino = 'aguardando_coleta';
            } else {
              etapaDestino = 'aguardando_instalacao';
            }
          }
        }
      }

      // Lógica condicional quando sai de aguardando_pintura
      if (etapaAtualNome === 'aguardando_pintura') {
        const { data: pedidoData } = await supabase
          .from('pedidos_producao')
          .select('venda_id')
          .eq('id', pedidoId)
          .single();
        
        console.log('[moverParaProximaEtapa] Saindo de aguardando_pintura, pedidoId:', pedidoId, 'vendaId:', pedidoData?.venda_id);
        
        if (pedidoData?.venda_id) {
          const { data: venda } = await supabase
            .from('vendas')
            .select('tipo_entrega')
            .eq('id', pedidoData.venda_id)
            .single();
          
          console.log('[moverParaProximaEtapa] tipo_entrega da venda:', venda?.tipo_entrega);
          
          if (venda?.tipo_entrega === 'entrega') {
            etapaDestino = 'aguardando_coleta';
            console.log('[moverParaProximaEtapa] ✓ Pedido é ENTREGA → indo para aguardando_coleta');
          } else if (venda?.tipo_entrega === 'instalacao') {
            etapaDestino = 'aguardando_instalacao';
            console.log('[moverParaProximaEtapa] ✓ Pedido é INSTALAÇÃO → indo para aguardando_instalacao');
          } else {
            console.warn('[moverParaProximaEtapa] ⚠️ tipo_entrega desconhecido:', venda?.tipo_entrega, '→ usando aguardando_instalacao por padrão');
            etapaDestino = 'aguardando_instalacao';
          }
        }
      }

      // Lógica condicional quando sai de aguardando_coleta
      // Se está em aguardando_coleta, é SEMPRE uma entrega e deve ir para finalizado
      if (etapaAtualNome === 'aguardando_coleta') {
        etapaDestino = 'finalizado';
        console.log('[moverParaProximaEtapa] Pedido em aguardando_coleta avançando para finalizado');
      }

      // ===== CRIAR NOVA ETAPA COM A ETAPA DESTINO CORRETA =====
      if (onProgress) onProgress('criar_nova_etapa', 'in_progress');
      await executarComDelay(async () => {
        const checkboxesNovos = ETAPAS_CONFIG[etapaDestino].checkboxes.map(cb => ({
          ...cb,
          checked: false
        }));

        const { error: etapaError } = await supabase
          .from('pedidos_etapas')
          .insert({
            pedido_id: pedidoId,
            etapa: etapaDestino,
            checkboxes: checkboxesNovos as any
          });

        if (etapaError) throw etapaError;
      });
      if (onProgress) onProgress('criar_nova_etapa', 'completed');

      // Registrar movimentação no histórico
      await supabase.from('pedidos_movimentacoes').insert({
        pedido_id: pedidoId,
        user_id: user.id,
        etapa_origem: etapaAtualNome,
        etapa_destino: etapaDestino,
        teor: 'avanco',
        descricao: `Pedido avançou de ${ETAPAS_CONFIG[etapaAtualNome].label} para ${ETAPAS_CONFIG[etapaDestino].label}`
      });

      // Atualizar pedido e resetar prioridade
      if (onProgress) onProgress('atualizar_pedido', 'in_progress');
      await executarComDelay(async () => {
        const { error: updateError } = await supabase
          .from('pedidos_producao')
          .update({ 
            etapa_atual: etapaDestino,
            status: etapaDestino === 'finalizado' ? 'concluido' : 'em_andamento',
            prioridade_etapa: 0
          })
          .eq('id', pedidoId);

        if (updateError) throw updateError;

        // Sincronizar status da instalação com a etapa do pedido (se existir)
        // Mapeamento de etapas para status válidos de instalação
        const statusInstalacao = 
          etapaDestino === 'aberto' ? 'pendente_producao' :
          etapaDestino === 'em_producao' ? 'em_producao' :
          etapaDestino === 'inspecao_qualidade' ? 'em_producao' :
          etapaDestino === 'aguardando_pintura' ? 'em_producao' :
          etapaDestino === 'aguardando_instalacao' ? 'pronta_fabrica' :
          etapaDestino === 'finalizado' ? 'finalizada' :
          'pendente_producao';
        
        console.log('[moverParaProximaEtapa] Sincronizando instalação:', { etapaDestino, statusInstalacao });
        const { data: instalacaoData, error: instalacaoError } = await supabase
          .from('instalacoes')
          .update({ status: statusInstalacao })
          .eq('pedido_id', pedidoId)
          .select('id, status');

        if (instalacaoError) {
          console.error('[moverParaProximaEtapa] Erro ao atualizar status da instalação:', instalacaoError);
        } else if (instalacaoData && instalacaoData.length > 0) {
          console.log('[moverParaProximaEtapa] Status da instalação atualizado:', instalacaoData);
        }

        // Tabela entregas foi removida - sincronização não é mais necessária

        // Criar ordem de carregamento se avançar para aguardando_coleta ou aguardando_instalacao
        if (etapaDestino === 'aguardando_coleta' || etapaDestino === 'aguardando_instalacao') {
          if (onProgress) onProgress('criar_ordem_carregamento', 'in_progress');
          await executarComDelay(async () => {
            console.log('[moverParaProximaEtapa] Verificando necessidade de criar ordem de carregamento');
            
            // Verificar se já existe uma ordem de carregamento para este pedido
            const { data: ordemExistente } = await supabase
              .from('ordens_carregamento')
              .select('id')
              .eq('pedido_id', pedidoId)
              .maybeSingle();

            if (!ordemExistente) {
              // Buscar dados da venda para criar a ordem de carregamento
              const { data: pedidoData } = await supabase
                .from('pedidos_producao')
                .select('venda_id')
                .eq('id', pedidoId)
                .single();

              if (pedidoData?.venda_id) {
                const { data: venda } = await supabase
                  .from('vendas')
                  .select('cliente_nome, tipo_entrega')
                  .eq('id', pedidoData.venda_id)
                  .single();

                if (venda) {
                  const { error: ordemError } = await supabase
                    .from('ordens_carregamento')
                    .insert({
                      pedido_id: pedidoId,
                      venda_id: pedidoData.venda_id,
                      nome_cliente: venda.cliente_nome,
                      hora: '08:00',
                      status: 'pronta_fabrica',
                      tipo_carregamento: 'elisa', // Default para ambos (instalação e entrega)
                      created_by: user.id,
                      data_carregamento: null // Explicitamente sem data - deve ser agendada manualmente
                    });

                  if (ordemError) {
                    console.error('[moverParaProximaEtapa] Erro ao criar ordem de carregamento:', ordemError);
                  } else {
                    console.log('[moverParaProximaEtapa] ✓ Ordem de carregamento criada com sucesso');
                  }
                }
              }
            } else {
              console.log('[moverParaProximaEtapa] Ordem de carregamento já existe, sincronizando status');
              // Atualizar status da ordem existente
              await supabase
                .from('ordens_carregamento')
                .update({ status: 'pronta_fabrica' })
                .eq('pedido_id', pedidoId);
            }
          });
          if (onProgress) onProgress('criar_ordem_carregamento', 'completed');
        }
      });
      if (onProgress) onProgress('atualizar_pedido', 'completed');

      // Se avançou para produção, criar ordens automaticamente
      if (proximaEtapa === 'em_producao') {
        // Buscar linhas para determinar quais ordens criar
        const { data: linhas } = await supabase
          .from('pedido_linhas')
          .select('*, estoque:estoque_id(setor_responsavel_producao)')
          .eq('pedido_id', pedidoId);

        const temSolda = linhas?.some(l => 
          !l.estoque?.setor_responsavel_producao || 
          l.estoque?.setor_responsavel_producao === 'soldagem'
        );
        const temPerfiladeira = linhas?.some(l => 
          l.estoque?.setor_responsavel_producao === 'perfiladeira'
        );
        const temSeparacao = linhas?.some(l => 
          l.estoque?.setor_responsavel_producao === 'separacao'
        );

        // Criar ordens com progresso
        if (temPerfiladeira && onProgress) {
          onProgress('criar_ordem_perfiladeira', 'in_progress');
          await executarComDelay(async () => {});
          onProgress('criar_ordem_perfiladeira', 'completed');
        }

        if (temSolda && onProgress) {
          onProgress('criar_ordem_solda', 'in_progress');
          await executarComDelay(async () => {});
          onProgress('criar_ordem_solda', 'completed');
        }

        if (temSeparacao && onProgress) {
          onProgress('criar_ordem_separacao', 'in_progress');
          await executarComDelay(async () => {});
          onProgress('criar_ordem_separacao', 'completed');
        }

        // Executar criação real das ordens
        await criarOrdensProducao(pedidoId);

        // Verificar se precisa criar instalação ou entrega
        const { data: pedidoData } = await supabase
          .from('pedidos_producao')
          .select('venda_id')
          .eq('id', pedidoId)
          .single();

        if (pedidoData?.venda_id) {
          const { data: venda } = await supabase
            .from('vendas')
            .select('tipo_entrega')
            .eq('id', pedidoData.venda_id)
            .single();

          if (venda?.tipo_entrega === 'instalacao' && onProgress) {
            onProgress('criar_instalacao', 'in_progress');
            await executarComDelay(async () => {
              console.log('[moverParaProximaEtapa] Criando instalação para pedido:', pedidoId);
              
              // Buscar dados da venda para criar a instalação
              const { data: vendaCompleta } = await supabase
                .from('vendas')
                .select('cliente_nome, cliente_telefone, cidade, estado')
                .eq('id', pedidoData.venda_id)
                .single();
              
              if (vendaCompleta) {
                const { error: instalacaoError } = await supabase
                  .from('instalacoes')
                  .insert({
                    pedido_id: pedidoId,
                    venda_id: pedidoData.venda_id,
                    nome_cliente: vendaCompleta.cliente_nome || 'Cliente',
                    hora: '08:00',
                    status: 'em_producao',
                    tipo_instalacao: 'elisa',
                    created_by: user.id
                  });
                
                if (instalacaoError) {
                  console.error('[moverParaProximaEtapa] Erro ao criar instalação:', instalacaoError);
                } else {
                  console.log('[moverParaProximaEtapa] ✓ Instalação criada com sucesso');
                }
              }
            });
            onProgress('criar_instalacao', 'completed');
          }
          // Tabela entregas foi removida - lógica de entrega não é mais necessária
        }
      }

      // Se avançou para inspeção de qualidade, criar ordem de qualidade
      if (proximaEtapa === 'inspecao_qualidade') {
        if (onProgress) onProgress('criar_ordem_qualidade', 'in_progress');
        await executarComDelay(async () => {
          console.log('[moverParaProximaEtapa] Criando ordem de qualidade para pedido:', pedidoId);
          const { error: qualidadeError } = await supabase.rpc('criar_ordem_qualidade', {
            p_pedido_id: pedidoId
          });

          if (qualidadeError) {
            console.error('[moverParaProximaEtapa] Erro ao criar ordem de qualidade:', qualidadeError);
            throw qualidadeError;
          }
          console.log('[moverParaProximaEtapa] Ordem de qualidade criada com sucesso');
        });
        if (onProgress) onProgress('criar_ordem_qualidade', 'completed');
      }

      // Se avançou para aguardando_pintura, criar ordem de pintura
      if (etapaDestino === 'aguardando_pintura') {
        if (onProgress) onProgress('criar_ordem_pintura', 'in_progress');
        await executarComDelay(async () => {
          console.log('[moverParaProximaEtapa] Criando ordem de pintura para pedido:', pedidoId);
          const { error: pinturaError } = await supabase.rpc('criar_ordem_pintura', {
            p_pedido_id: pedidoId
          });

          if (pinturaError) {
            console.error('[moverParaProximaEtapa] Erro ao criar ordem de pintura:', pinturaError);
            throw pinturaError;
          }
          console.log('[moverParaProximaEtapa] Ordem de pintura criada com sucesso');
        });
        if (onProgress) onProgress('criar_ordem_pintura', 'completed');
      }

      // Se avançou para aguardando_coleta
      if (etapaDestino === 'aguardando_coleta') {
        if (onProgress) onProgress('preparar_coleta', 'in_progress');
        await executarComDelay(async () => {
          console.log('[moverParaProximaEtapa] Preparando coleta para pedido:', pedidoId);
        });
        if (onProgress) onProgress('preparar_coleta', 'completed');
      }

      // Se avançou para aguardando_instalacao, garantir que a instalação existe
      if (etapaDestino === 'aguardando_instalacao') {
        if (onProgress) onProgress('preparar_instalacao', 'in_progress');
        await executarComDelay(async () => {
          console.log('[moverParaProximaEtapa] Preparando instalação para pedido:', pedidoId);
          
          // Verificar se já existe instalação
          const { data: instalacaoExistente } = await supabase
            .from('instalacoes')
            .select('id, status')
            .eq('pedido_id', pedidoId)
            .maybeSingle();
          
          if (instalacaoExistente) {
            // Atualizar status da instalação existente
            console.log('[moverParaProximaEtapa] Instalação já existe, atualizando status para pronta_fabrica');
            await supabase
              .from('instalacoes')
              .update({ status: 'pronta_fabrica' })
              .eq('id', instalacaoExistente.id);
          } else {
            // Criar instalação se não existir
            console.log('[moverParaProximaEtapa] ⚠️ Instalação não existe, criando agora...');
            
            const { data: pedidoData } = await supabase
              .from('pedidos_producao')
              .select('venda_id')
              .eq('id', pedidoId)
              .single();
            
            if (pedidoData?.venda_id) {
              const { data: vendaCompleta } = await supabase
                .from('vendas')
                .select('cliente_nome, cliente_telefone, cidade, estado')
                .eq('id', pedidoData.venda_id)
                .single();
              
              if (vendaCompleta) {
                const { error: instalacaoError } = await supabase
                  .from('instalacoes')
                  .insert({
                    pedido_id: pedidoId,
                    venda_id: pedidoData.venda_id,
                    nome_cliente: vendaCompleta.cliente_nome || 'Cliente',
                    hora: '08:00',
                    status: 'pronta_fabrica',
                    tipo_instalacao: 'elisa',
                    created_by: user.id
                  });
                
                if (instalacaoError) {
                  console.error('[moverParaProximaEtapa] Erro ao criar instalação faltante:', instalacaoError);
                  throw new Error('Não foi possível criar a instalação');
                } else {
                  console.log('[moverParaProximaEtapa] ✓ Instalação criada com sucesso (criação tardia)');
                }
              }
            }
          }
        });
        if (onProgress) onProgress('preparar_instalacao', 'completed');
      }

      return { etapaAtualNome, proximaEtapa: etapaDestino };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      toast({
        title: "Etapa avançada",
        description: `Pedido movido para ${ETAPAS_CONFIG[data.proximaEtapa].label}`
      });
    },
    onError: (error: any) => {
      console.error('Erro ao mover etapa:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível avançar a etapa",
        variant: "destructive"
      });
    }
  });

  // Atualizar prioridade de um pedido
  const atualizarPrioridade = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      novaPrioridade 
    }: { 
      pedidoId: string; 
      novaPrioridade: number;
    }) => {
      const { error } = await supabase
        .from('pedidos_producao')
        .update({ prioridade_etapa: novaPrioridade })
        .eq('id', pedidoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
      toast({
        title: "Prioridade atualizada",
        description: "A prioridade do pedido foi atualizada"
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar prioridade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a prioridade",
        variant: "destructive"
      });
    },
  });

  // Reorganizar múltiplos pedidos (drag-and-drop)
  const reorganizarPedidos = useMutation({
    mutationFn: async (atualizacoes: { id: string; prioridade: number }[]) => {
      const updates = atualizacoes.map(({ id, prioridade }) =>
        supabase
          .from('pedidos_producao')
          .update({ prioridade_etapa: prioridade })
          .eq('id', id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
      toast({
        title: "Pedidos reorganizados",
        description: "As prioridades foram atualizadas com sucesso"
      });
    },
    onError: (error) => {
      console.error('Erro ao reorganizar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reorganizar os pedidos",
        variant: "destructive"
      });
    },
  });

  // Retroceder pedido para qualquer etapa (backlog)
  const retrocederEtapa = useMutation({
    mutationFn: async ({ pedidoId, etapaDestino, motivo }: { 
      pedidoId: string; 
      etapaDestino: EtapaPedido; 
      motivo: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (adminError || adminData?.role !== 'administrador') {
        throw new Error('Apenas administradores podem retroceder pedidos');
      }

      // Chamar função RPC que faz o retrocesso
      const { data, error } = await supabase.rpc('retroceder_pedido_para_etapa', {
        p_pedido_id: pedidoId,
        p_etapa_destino: etapaDestino,
        p_motivo_backlog: motivo,
        p_user_id: user.id
      });

      if (error) throw error;
      
      // Verificar retorno da função RPC (pode retornar success: false)
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        throw new Error((data as any).error || 'Erro ao retroceder pedido');
      }

      return { etapaDestino };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      queryClient.invalidateQueries({ queryKey: ['pedido-view'] });
      toast({
        title: "Pedido Retornado",
        description: `O pedido foi marcado como BACKLOG e retornou para: ${ETAPAS_CONFIG[data.etapaDestino].label}`
      });
    },
    onError: (error: any) => {
      console.error('Erro ao retroceder pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível retroceder o pedido",
        variant: "destructive"
      });
    }
  });

  const arquivarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Atualizar pedido para arquivado
      const { error } = await supabase
        .from('pedidos_producao')
        .update({ 
          arquivado: true,
          data_arquivamento: new Date().toISOString(),
          arquivado_por: user.id
        })
        .eq('id', pedidoId)
        .eq('etapa_atual', 'finalizado');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      toast({ 
        title: "Pedido arquivado", 
        description: "O pedido foi arquivado com sucesso" 
      });
    },
    onError: (error) => {
      console.error('[arquivarPedido] Erro:', error);
      toast({ 
        title: "Erro ao arquivar", 
        description: "Não foi possível arquivar o pedido", 
        variant: "destructive" 
      });
    }
  });

  // Deletar pedido e todas as suas ordens
  const deletarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (adminError || adminData?.role !== 'administrador') {
        throw new Error('Apenas administradores podem deletar pedidos');
      }

      // Chamar função RPC que deleta tudo
      const { error } = await supabase.rpc('deletar_pedido_completo', {
        pedido_uuid: pedidoId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      queryClient.invalidateQueries({ queryKey: ['historico-ordens'] });
      toast({
        title: "Pedido deletado",
        description: "O pedido e todas as suas ordens foram deletados com sucesso"
      });
    },
    onError: (error: any) => {
      console.error('Erro ao deletar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o pedido",
        variant: "destructive"
      });
    }
  });

  // Remover responsável de uma ordem
  const removerResponsavelOrdem = useMutation({
    mutationFn: async ({ ordemId, tipoOrdem }: { ordemId: string; tipoOrdem: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Mapear tipo de ordem para tabela
      const tabelaMap: Record<string, string> = {
        soldagem: 'ordens_soldagem',
        perfiladeira: 'ordens_perfiladeira',
        separacao: 'ordens_separacao',
        qualidade: 'ordens_qualidade',
        pintura: 'ordens_pintura',
      };

      const tabela = tabelaMap[tipoOrdem];
      if (!tabela) throw new Error('Tipo de ordem inválido');

      // Atualizar a ordem removendo o responsável e voltando status para pendente
      const { error } = await supabase
        .from(tabela as any)
        .update({ 
          responsavel_id: null,
          status: 'pendente',
          data_inicio: null,
        })
        .eq('id', ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      toast({
        title: "Responsável removido",
        description: "O responsável foi removido da ordem com sucesso"
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover responsável:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o responsável",
        variant: "destructive"
      });
    }
  });

  return {
    pedidos,
    isLoading,
    atualizarCheckbox,
    moverParaProximaEtapa,
    retrocederEtapa,
    getEtapaAtual,
    atualizarPrioridade,
    reorganizarPedidos,
    arquivarPedido,
    deletarPedido,
    removerResponsavelOrdem,
  };
}
