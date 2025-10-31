import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PedidoPortaObservacoes, PedidoPortaObservacoesInsert } from "@/types/pedidoObservacoes";

export function usePedidoPortaObservacoes(pedidoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['pedido-porta-observacoes', pedidoId];

  const { data: observacoes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_porta_observacoes')
        .select(`
          *,
          responsavel:admin_users(id, nome, email)
        `)
        .eq('pedido_id', pedidoId);

      if (error) throw error;
      return data as PedidoPortaObservacoes[];
    },
    enabled: !!pedidoId,
  });

  const salvarObservacao = useMutation({
    mutationFn: async (dados: PedidoPortaObservacoesInsert) => {
      const { data, error } = await supabase
        .from('pedido_porta_observacoes')
        .upsert({
          ...dados,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'pedido_id,produto_venda_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Observações salvas",
        description: "As observações da porta foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getObservacoesPorPorta = (produtoVendaId: string) => {
    return observacoes.find(obs => obs.produto_venda_id === produtoVendaId);
  };

  return {
    observacoes,
    isLoading,
    salvarObservacao: salvarObservacao.mutateAsync,
    getObservacoesPorPorta,
  };
}
