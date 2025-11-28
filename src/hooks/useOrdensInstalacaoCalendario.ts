import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";

export const useOrdensInstalacaoCalendario = (
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
    queryKey: ["ordens_instalacao_calendario", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas!inner(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega,
            tipo_entrega,
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
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual,
            arquivado,
            data_producao,
            instalacao:instalacoes(
              id,
              instalacao_concluida,
              instalacao_concluida_em,
              instalacao_concluida_por,
              responsavel_instalacao_id,
              responsavel_instalacao_nome,
              tipo_instalacao
            )
          )
        `)
        .eq("venda.tipo_entrega", "instalacao")
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .order("data_carregamento", { ascending: true });

      if (error) throw error;
      
      // Filtrar apenas ordens que NÃO têm instalação concluída
      const filteredData = (data || []).filter((ordem: any) => {
        const instalacao = ordem.pedido?.instalacao?.[0];
        const etapaAtual = ordem.pedido?.etapa_atual;
        const arquivado = ordem.pedido?.arquivado;
        
        // Excluir se pedido está finalizado ou arquivado
        if (etapaAtual === 'finalizado' || arquivado === true) {
          return false;
        }
        
        // Excluir se instalação está concluída
        if (instalacao?.instalacao_concluida === true) {
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
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de instalação");
    },
  });

  const concluirInstalacaoMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("instalacoes")
        .update({
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
          instalacao_concluida_por: user.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq("pedido_id", pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir instalação:", error);
      toast.error("Erro ao concluir instalação");
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
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      toast.success("Ordem excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar ordem:", error);
      toast.error("Erro ao excluir ordem de instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('ordens-instalacao-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario", inicio, fim] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario", inicio, fim] });
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
    concluirInstalacao: concluirInstalacaoMutation.mutateAsync,
    deleteOrdem: deleteOrdemMutation.mutateAsync,
    isUpdating: updateOrdemMutation.isPending,
    isConcluindo: concluirInstalacaoMutation.isPending,
    isDeleting: deleteOrdemMutation.isPending,
  };
};
