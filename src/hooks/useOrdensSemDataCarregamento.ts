import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useEffect } from "react";

export const useOrdensSemDataCarregamento = () => {
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading, refetch } = useQuery({
    queryKey: ["ordens_sem_data_carregamento"],
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
        .is("data_carregamento", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []) as OrdemCarregamento[];
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamento> }) => {
      const { error } = await supabase
        .from("ordens_carregamento")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_sem_data_carregamento"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('ordens-sem-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_sem_data_carregamento"] });
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
          queryClient.invalidateQueries({ queryKey: ["ordens_sem_data_carregamento"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    ordens,
    isLoading,
    updateOrdem: updateOrdemMutation.mutateAsync,
    isUpdating: updateOrdemMutation.isPending,
    refetch,
  };
};
