import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "./usePedidosEtapas";
import { useEffect } from "react";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao';

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
  linhas?: LinhaOrdem[];
  pedido?: {
    cliente_nome: string;
  };
}

const TABELA_MAP: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
};

export function useOrdemProducao(tipoOrdem: TipoOrdem) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { moverParaProximaEtapa } = usePedidosEtapas();

  // Buscar todas as ordens do tipo
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ['ordens-producao', tipoOrdem],
    queryFn: async () => {
      let ordensData: any[] = [];
      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      // Buscar ordens baseado no tipo
      const { data, error } = await supabase
        .from(tabelaOrdem)
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      ordensData = data || [];

      // Buscar dados do pedido e linhas de cada ordem
      const ordensComLinhas = await Promise.all(
        ordensData.map(async (ordem: any) => {
          // Buscar dados do pedido
          const { data: pedido } = await supabase
            .from('pedidos_producao')
            .select('cliente_nome')
            .eq('id', ordem.pedido_id)
            .single();

          // Buscar linhas da ordem usando ordem_id e tipo_ordem
          const { data: linhas } = await supabase
            .from('linhas_ordens')
            .select('*')
            .eq('ordem_id', ordem.id)
            .eq('tipo_ordem', tipoOrdem)
            .order('created_at', { ascending: true });

          return {
            ...ordem,
            linhas: linhas || [],
            pedido: pedido || null,
          } as Ordem;
        })
      );

      return ordensComLinhas;
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
    onSuccess: () => {
      toast({
        title: "Atualizado",
      });
    },
  });

  // Concluir ordem
  const concluirOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      let pedidoId: string | null = null;

      // Buscar e atualizar baseado no tipo
      if (tipoOrdem === 'soldagem') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_soldagem')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_soldagem')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      } else if (tipoOrdem === 'perfiladeira') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_perfiladeira')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_perfiladeira')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      } else if (tipoOrdem === 'separacao') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_separacao')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_separacao')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      }

      if (!pedidoId) throw new Error('Pedido ID não encontrado');
      return pedidoId;
    },
    onSuccess: async (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      
      toast({
        title: "Ordem concluída",
        description: "A ordem foi concluída com sucesso.",
      });

      // Verificar se todas as ordens do pedido estão concluídas
      const { data: todasConcluidas } = await supabase
        .rpc('verificar_ordens_pedido_concluidas', { p_pedido_id: pedidoId });

      if (todasConcluidas) {
        // Avançar pedido automaticamente
        try {
          await moverParaProximaEtapa.mutateAsync(pedidoId);
          toast({
            title: "Pedido avançado automaticamente",
            description: "Todas as ordens foram concluídas. O pedido foi movido para Inspeção da Qualidade.",
          });
        } catch (error) {
          console.error('Erro ao avançar pedido:', error);
        }
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

  // Separar ordens por status
  const ordensAFazer = ordens.filter(o => o.status === 'pendente');
  const ordensConcluidas = ordens.filter(o => o.status === 'concluido');

  return {
    ordens,
    ordensAFazer,
    ordensConcluidas,
    isLoading,
    marcarLinhaConcluida,
    concluirOrdem,
  };
}
