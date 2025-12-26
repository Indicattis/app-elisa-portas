import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PedidoPortaSocialObservacoes, PedidoPortaSocialObservacoesInsert } from "@/types/pedidoPortaSocialObservacoes";

export function usePedidoPortaSocialObservacoes(pedidoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['pedido-porta-social-observacoes', pedidoId];

  const { data: observacoes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_porta_social_observacoes')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (error) throw error;
      return data as PedidoPortaSocialObservacoes[];
    },
    enabled: !!pedidoId,
  });

  const salvarObservacao = useMutation({
    mutationFn: async (dados: PedidoPortaSocialObservacoesInsert & { indice_porta?: number }) => {
      const { data, error } = await supabase
        .from('pedido_porta_social_observacoes')
        .upsert({
          ...dados,
          indice_porta: dados.indice_porta ?? 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'pedido_id,produto_venda_id,indice_porta'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Especificações salvas",
        description: "As especificações da porta social foram atualizadas com sucesso.",
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

  const getObservacoesPorPorta = (produtoVendaId: string, indicePorta: number = 0) => {
    return observacoes.find(
      obs => obs.produto_venda_id === produtoVendaId && 
             (obs.indice_porta ?? 0) === indicePorta
    );
  };

  return {
    observacoes,
    isLoading,
    salvarObservacao: salvarObservacao.mutateAsync,
    getObservacoesPorPorta,
  };
}
