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
        .select('etapa_atual');

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
      if (etapa === 'aberto') {
        // Buscar pedidos na etapa aberto
        const { data, error } = await supabase
          .from('pedidos_producao')
          .select(`
            *,
            vendas:venda_id (
              id,
              cliente_nome,
              cliente_telefone,
              valor_venda,
              created_at,
              produtos_vendas (
                id,
                tipo_produto,
                cor:catalogo_cores (nome)
              )
            ),
            pedidos_etapas (*)
          `)
          .eq('etapa_atual', 'aberto')
          .order('prioridade_etapa', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        // Buscar pedidos por etapa, ordenados por prioridade
        const { data, error } = await supabase
          .from('pedidos_producao')
          .select(`
            *,
            vendas:venda_id (
              id,
              cliente_nome,
              cliente_telefone,
              valor_venda,
              created_at,
              produtos_vendas (
                id,
                tipo_produto,
                cor:catalogo_cores (nome)
              )
            ),
            pedidos_etapas (*)
          `)
          .eq('etapa_atual', etapa)
          .order('prioridade_etapa', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      }
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
      const proximaEtapa = getProximaEtapa(etapaAtualNome);

      if (!proximaEtapa) {
        throw new Error('Pedido já está na última etapa');
      }

      // Se está na etapa "aberto", validar se tem linhas cadastradas
      if (etapaAtualNome === 'aberto') {
        const { data: linhas, error: linhasError } = await supabase
          .from('pedido_linhas')
          .select('id')
          .eq('pedido_id', pedidoId);
        
        if (linhasError) throw linhasError;
        
        if (!linhas || linhas.length === 0) {
          throw new Error('O pedido precisa ter ao menos uma linha cadastrada antes de iniciar a produção');
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

      // Criar nova etapa com checkboxes
      if (onProgress) onProgress('criar_nova_etapa', 'in_progress');
      await executarComDelay(async () => {
        const checkboxesNovos = ETAPAS_CONFIG[proximaEtapa].checkboxes.map(cb => ({
          ...cb,
          checked: false
        }));

        const { error: etapaError } = await supabase
          .from('pedidos_etapas')
          .insert({
            pedido_id: pedidoId,
            etapa: proximaEtapa,
            checkboxes: checkboxesNovos as any
          });

        if (etapaError) throw etapaError;
      });
      if (onProgress) onProgress('criar_nova_etapa', 'completed');

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
        
        if (pedidoData?.venda_id) {
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
          l.estoque?.setor_responsavel_producao === 'solda'
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
            await executarComDelay(async () => {});
            onProgress('criar_instalacao', 'completed');
          } else if (venda?.tipo_entrega === 'entrega' && onProgress) {
            onProgress('criar_entrega', 'in_progress');
            await executarComDelay(async () => {});
            onProgress('criar_entrega', 'completed');
          }
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

      // Se avançou para aguardando_instalacao
      if (etapaDestino === 'aguardando_instalacao') {
        if (onProgress) onProgress('preparar_instalacao', 'in_progress');
        await executarComDelay(async () => {
          console.log('[moverParaProximaEtapa] Preparando instalação para pedido:', pedidoId);
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

  // Resetar pedido para etapa inicial (apenas admins)
  const retrocederEtapa = useMutation({
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
        throw new Error('Apenas administradores podem resetar pedidos');
      }

      // Chamar função RPC que faz todo o reset
      const { error } = await supabase.rpc('resetar_pedido_para_aberto', {
        p_pedido_id: pedidoId
      });

      if (error) throw error;

      return { etapaAtualNome: 'resetado', etapaAnterior: 'aberto' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      queryClient.invalidateQueries({ queryKey: ['pedido-preparacao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-soldagem'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-perfiladeira'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-separacao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-qualidade'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
      toast({
        title: "Pedido Resetado",
        description: "O pedido foi completamente resetado para a etapa Aberto"
      });
    },
    onError: (error: any) => {
      console.error('Erro ao resetar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível resetar o pedido",
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
  };
}
