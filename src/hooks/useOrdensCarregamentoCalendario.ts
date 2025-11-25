import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";

export const useOrdensCarregamentoCalendario = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
) => {
  const queryClient = useQueryClient();

  // Calcular intervalo de datas baseado no período
  const getDateRange = () => {
    if (periodo === 'week') {
      return {
        inicio: format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        fim: format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    } else {
      return {
        inicio: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        fim: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
      };
    }
  };

  const { inicio, fim } = getDateRange();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens_carregamento_calendario", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega,
            produtos:produtos_vendas(
              tipo_produto,
              tamanho,
              largura,
              altura,
              quantidade,
              cor:catalogo_cores(
                nome,
                codigo_hex
              )
            )
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual,
            instalacao:instalacoes(
              id,
              responsavel_instalacao_id,
              responsavel_instalacao_nome
            )
          )
        `)
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .order("data_carregamento", { ascending: true });

      if (error) throw error;
      
      // Filtrar ordens cujo pedido está finalizado ou arquivado
      const filteredData = (data || []).filter((ordem: any) => {
        const etapaAtual = ordem.pedido?.etapa_atual;
        const arquivado = ordem.pedido?.arquivado;
        
        // Excluir se etapa é finalizado ou se está arquivado
        if (etapaAtual === 'finalizado' || arquivado === true) {
          return false;
        }
        return true;
      });
      
      return filteredData as OrdemCarregamento[];
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamento> }) => {
      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de carregamento");
    },
  });

  const deleteOrdemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordens_carregamento")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      toast.success("Ordem excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar ordem:", error);
      toast.error("Erro ao excluir ordem de carregamento");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('ordens-carregamento-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          // Invalidar queries para recarregar dados
          queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario", inicio, fim] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inicio, fim, queryClient]);

  return {
    ordens,
    isLoading,
    updateOrdem: updateOrdemMutation.mutateAsync,
    deleteOrdem: deleteOrdemMutation.mutateAsync,
    isUpdating: updateOrdemMutation.isPending,
    isDeleting: deleteOrdemMutation.isPending,
  };
};
