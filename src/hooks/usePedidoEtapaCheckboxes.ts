import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PedidoCheckbox, EtapaPedido, ETAPAS_CONFIG } from "@/types/pedidoEtapa";

export function usePedidoEtapaCheckboxes(pedidoId: string, etapa: EtapaPedido) {
  const queryClient = useQueryClient();

  // Buscar checkboxes da etapa atual
  const { data: etapaData, isLoading } = useQuery({
    queryKey: ['pedido-etapa-checkboxes', pedidoId, etapa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_etapas')
        .select('checkboxes')
        .eq('pedido_id', pedidoId)
        .eq('etapa', etapa)
        .is('data_saida', null)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!pedidoId && !!etapa
  });

  const rawCheckboxes = etapaData?.checkboxes 
    ? JSON.parse(JSON.stringify(etapaData.checkboxes)) 
    : ETAPAS_CONFIG[etapa]?.checkboxes?.map(cb => ({ ...cb, checked: false })) ?? [];
  const checkboxes: PedidoCheckbox[] = Array.isArray(rawCheckboxes) ? rawCheckboxes : [];

  // Mutation para atualizar checkbox
  const { mutate: atualizarCheckbox } = useMutation({
    mutationFn: async ({ checkboxId, checked }: { checkboxId: string; checked: boolean }) => {
      const updatedCheckboxes = checkboxes.map(cb =>
        cb.id === checkboxId
          ? { ...cb, checked, checked_at: checked ? new Date().toISOString() : undefined }
          : cb
      );

      const { error } = await supabase
        .from('pedidos_etapas')
        .update({ checkboxes: JSON.parse(JSON.stringify(updatedCheckboxes)) })
        .eq('pedido_id', pedidoId)
        .eq('etapa', etapa)
        .is('data_saida', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-etapa-checkboxes', pedidoId, etapa] });
      toast.success('Progresso atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const todosObrigatoriosMarcados = checkboxes
    .filter(cb => cb.required)
    .every(cb => cb.checked);

  return {
    checkboxes,
    isLoading,
    atualizarCheckbox: (checkboxId: string, checked: boolean) => 
      atualizarCheckbox({ checkboxId, checked }),
    todosObrigatoriosMarcados
  };
}
