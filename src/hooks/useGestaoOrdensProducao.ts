import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  pausarOrdemProducao,
  despausarOrdemProducao,
  type TipoOrdemProducao,
} from "@/lib/pausarOrdemProducao";

export function useGestaoOrdensProducao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
    queryClient.invalidateQueries({ queryKey: ['pedido-ordens-status'] });
  };

  const pausarOrdem = useMutation({
    mutationFn: async (params: {
      ordemId: string;
      tipoOrdem: TipoOrdemProducao;
      justificativa: string;
      linhasProblemaIds?: string[];
      comentarioPedido?: string;
    }) => pausarOrdemProducao(params),
    onSuccess: () => {
      invalidate();
      toast({
        title: "Ordem pausada",
        description: "A ordem foi pausada e está disponível para outro operador.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao pausar",
        description: error?.message || "Não foi possível pausar a ordem.",
        variant: "destructive",
      });
    },
  });

  const despausarOrdem = useMutation({
    mutationFn: async (params: { ordemId: string; tipoOrdem: TipoOrdemProducao }) =>
      despausarOrdemProducao(params),
    onSuccess: () => {
      invalidate();
      toast({
        title: "Ordem retomada",
        description: "A ordem foi liberada para captura por qualquer operador.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao retomar",
        description: error?.message || "Não foi possível retomar a ordem.",
        variant: "destructive",
      });
    },
  });

  return { pausarOrdem, despausarOrdem };
}