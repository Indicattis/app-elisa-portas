import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
  concluida_em?: string;
  concluida_por?: string;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  data_conclusao?: string;
  observacoes?: string;
  responsavel_id?: string;
  em_backlog?: boolean;
  prioridade?: number;
  linhas?: LinhaOrdem[];
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
    vendas?: {
      data_prevista_entrega?: string;
    };
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

const TABELA_MAP: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
};

export function useOrdemProducao(tipoOrdem: TipoOrdem, onOrdemConcluida?: (pedidoId: string, tipoOrdem: TipoOrdem) => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar todas as ordens do tipo
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ['ordens-producao', tipoOrdem],
    queryFn: async () => {
      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      // Buscar todas as ordens ativas (não histórico) - visíveis para todos
      const { data: ordensData, error: ordensError } = await supabase
        .from(tabelaOrdem)
        .select(`
          *,
          capturada_em,
          tempo_conclusao_segundos,
          em_backlog,
          prioridade,
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido,
            cliente_nome,
            venda_id,
            vendas(data_prevista_entrega)
          )
        `)
        .eq('historico', false)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (ordensError) throw ordensError;
      if (!ordensData || ordensData.length === 0) return [];
      
      // Buscar linhas para todas as ordens de uma vez
      const ordemIds = ordensData.map((o: any) => o.id);
      const { data: linhasData, error: linhasError } = await supabase
        .from('linhas_ordens')
        .select('*')
        .in('ordem_id', ordemIds)
        .eq('tipo_ordem', tipoOrdem);
      
      if (linhasError) throw linhasError;
      
      // Buscar dados dos responsáveis se houver
      const responsavelIds = ordensData
        .map((o: any) => o.responsavel_id)
        .filter((id: string | null) => id !== null);
      
      let responsaveisMap: Record<string, any> = {};
      if (responsavelIds.length > 0) {
        const { data: responsaveis } = await supabase
          .from('admin_users')
          .select('user_id, nome, foto_perfil_url')
          .in('user_id', responsavelIds);
        
        if (responsaveis) {
          responsaveisMap = responsaveis.reduce((acc, r) => {
            acc[r.user_id] = r;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Mapear linhas para suas ordens
      return ordensData.map((ordem: any) => {
        // Processar pedido e vendas
        let pedidoProcessado = null;
        if (ordem.pedido) {
          const vendasArray = Array.isArray(ordem.pedido.vendas) ? ordem.pedido.vendas : [ordem.pedido.vendas];
          const primeiraVenda = vendasArray.length > 0 ? vendasArray[0] : null;
          
          pedidoProcessado = {
            id: ordem.pedido.id,
            numero_pedido: ordem.pedido.numero_pedido,
            cliente_nome: ordem.pedido.cliente_nome,
            venda_id: ordem.pedido.venda_id,
            vendas: primeiraVenda,
          };
        }

        return {
          ...ordem,
          linhas: (linhasData || []).filter((linha: any) => linha.ordem_id === ordem.id),
          pedido: pedidoProcessado,
          admin_users: ordem.responsavel_id ? responsaveisMap[ordem.responsavel_id] || null : null,
        };
      }) as Ordem[];
    },
  });

  // Subscribe to realtime updates for linhas_ordens
  useEffect(() => {
    const channel = supabase
      .channel('linhas-ordens-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'linhas_ordens',
          filter: `tipo_ordem=eq.${tipoOrdem}`
        },
        () => {
          // Invalidate queries on any update to refresh data
          queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tipoOrdem, queryClient]);

  // Capturar ordem (atribuir responsável)
  const capturarOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      // Verificar se a ordem está em backlog
      const { data: ordemAtual } = await supabase
        .from(tabelaOrdem)
        .select('em_backlog, capturada_em')
        .eq('id', ordemId)
        .maybeSingle() as { data: { em_backlog?: boolean; capturada_em?: string } | null };
      
      // Se está em backlog e já tem capturada_em, manter o tempo original
      const updateData: any = {
        responsavel_id: user.id,
      };
      
      // Só atualizar capturada_em se NÃO estiver em backlog ou se ainda não tiver sido capturada
      if (!ordemAtual?.em_backlog || !ordemAtual?.capturada_em) {
        updateData.capturada_em = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from(tabelaOrdem)
        .update(updateData)
        .eq('id', ordemId);

      if (error) throw error;
      return ordemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      toast({
        title: "Ordem capturada",
        description: "Você agora é o responsável por esta ordem.",
      });
    },
    onError: (error) => {
      console.error('Erro ao capturar ordem:', error);
      toast({
        title: "Erro ao capturar",
        description: "Não foi possível capturar a ordem.",
        variant: "destructive",
      });
    },
  });

  // Marcar linha como concluída com atualização otimista
  const marcarLinhaConcluida = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('linhas_ordens')
        .update({
          concluida,
          concluida_em: concluida ? new Date().toISOString() : null,
          concluida_por: concluida ? user?.id : null,
        })
        .eq('id', linhaId);

      if (error) throw error;
      return { linhaId, concluida };
    },
    onMutate: async ({ linhaId, concluida }) => {
      // Cancel queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['ordens-producao', tipoOrdem] });

      // Snapshot for rollback
      const previousOrdens = queryClient.getQueryData<Ordem[]>(['ordens-producao', tipoOrdem]);

      // Optimistic update: immediately update the cache
      queryClient.setQueryData<Ordem[]>(['ordens-producao', tipoOrdem], (oldData) => {
        if (!oldData) return oldData;
        
        // Create new array with updated linha
        return oldData.map(ordem => ({
          ...ordem,
          linhas: ordem.linhas?.map(linha => 
            linha.id === linhaId
              ? { ...linha, concluida }
              : linha
          ) || []
        }));
      });

      return { previousOrdens };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousOrdens) {
        queryClient.setQueryData(['ordens-producao', tipoOrdem], context.previousOrdens);
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Buscar pedidoId da linha para invalidar a query de status
      const ordemComLinha = ordens.find(o => 
        o.linhas?.some(l => l.id === variables.linhaId)
      );
      
      if (ordemComLinha?.pedido_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['pedido-ordens-status', ordemComLinha.pedido_id] 
        });
        // Invalidar também status de qualidade se for ordem de qualidade
        if (tipoOrdem === 'qualidade') {
          queryClient.invalidateQueries({ 
            queryKey: ['pedido-qualidade-status', ordemComLinha.pedido_id] 
          });
        }
      }
      
      toast({
        title: "Atualizado",
      });
    },
  });

  // Concluir ordem e enviar diretamente para histórico
  const concluirOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      let pedidoId: string | null = null;
      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;

      // Buscar ordem para pegar capturada_em
      const { data: ordem, error: ordemError } = await supabase
        .from(tabelaOrdem)
        .select('pedido_id, capturada_em')
        .eq('id', ordemId)
        .maybeSingle();
        
      if (ordemError) throw ordemError;
      if (!ordem) throw new Error('Ordem não encontrada');
      
      pedidoId = (ordem as any).pedido_id;

      // Calcular tempo de conclusão
      let tempo_conclusao_segundos = null;
      if ((ordem as any)?.capturada_em) {
        const captura = new Date((ordem as any).capturada_em);
        const agora = new Date();
        tempo_conclusao_segundos = Math.floor((agora.getTime() - captura.getTime()) / 1000);
      }

      // Atualizar ordem como concluída E enviar para histórico
      const { error } = await supabase
        .from(tabelaOrdem)
        .update({ 
          status: 'concluido', 
          data_conclusao: new Date().toISOString(),
          tempo_conclusao_segundos,
          historico: true, // Enviar diretamente para histórico
        })
        .eq('id', ordemId);
        
      if (error) throw error;

      if (!pedidoId) throw new Error('Pedido ID não encontrado');
      return pedidoId;
    },
    onSuccess: async (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      queryClient.invalidateQueries({ queryKey: ['pedido-ordens-status', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['historico-ordens'] });
      
      // Invalidar também status de qualidade se for ordem de qualidade
      if (tipoOrdem === 'qualidade') {
        queryClient.invalidateQueries({ 
          queryKey: ['pedido-qualidade-status', pedidoId] 
        });
      }
      
      toast({
        title: "Ordem concluída e arquivada",
        description: "A ordem foi enviada para o histórico.",
      });

      // Tentar avanço automático do pedido
      if (onOrdemConcluida) {
        onOrdemConcluida(pedidoId, tipoOrdem);
      }
    },
    onError: (error) => {
      console.error('Erro ao concluir ordem:', error);
      toast({
        title: "Erro ao concluir",
        description: "Não foi possível concluir a ordem.",
        variant: "destructive",
      });
    },
  });

  // Separar ordens por status e ordenar por backlog e prioridade
  const ordensAFazer = ordens
    .filter(o => o.status === 'pendente')
    .sort((a, b) => {
      // Ordens em backlog primeiro
      if (a.em_backlog && !b.em_backlog) return -1;
      if (!a.em_backlog && b.em_backlog) return 1;
      // Depois por prioridade (maior primeiro)
      return (b.prioridade || 0) - (a.prioridade || 0);
    });

  // Enviar ordem para histórico
  const enviarParaHistorico = useMutation({
    mutationFn: async (ordemId: string) => {
      // Mapear nome da tabela de acordo com o tipo
      const tabelasMap = {
        soldagem: 'ordens_soldagem',
        perfiladeira: 'ordens_perfiladeira',
        separacao: 'ordens_separacao',
        qualidade: 'ordens_qualidade',
      } as const;

      const nomeTabela = tabelasMap[tipoOrdem];

      const { error } = await supabase
        .from(nomeTabela as any)
        .update({ historico: true })
        .eq("id", ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-producao", tipoOrdem] });
      queryClient.invalidateQueries({ queryKey: ["historico-ordens"] });
      toast({
        title: "Ordem enviada para histórico",
        description: "A ordem não aparecerá mais na lista de produção",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao enviar ordem para histórico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a ordem para o histórico",
        variant: "destructive",
      });
    },
  });

  return {
    ordens,
    ordensAFazer,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
    enviarParaHistorico,
  };
}
