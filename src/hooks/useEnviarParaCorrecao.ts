import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnviarParaCorrecaoParams {
  pedidoId: string;
  vendaId?: string | null;
  nomeCliente: string;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  telefoneCliente?: string | null;
  etapaOrigem?: string;
  descricaoMovimentacao?: string;
}

export const useEnviarParaCorrecao = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: EnviarParaCorrecaoParams) => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      const etapaOrigem = params.etapaOrigem || 'finalizado';

      // 1. Close origin stage
      await supabase
        .from("pedidos_etapas")
        .update({ data_saida: new Date().toISOString() })
        .eq("pedido_id", params.pedidoId)
        .eq("etapa", etapaOrigem)
        .is("data_saida", null);

      // 2. Create/upsert 'correcoes' stage
      const { error: upsertError } = await supabase
        .from("pedidos_etapas")
        .upsert({
          pedido_id: params.pedidoId,
          etapa: 'correcoes',
          data_entrada: new Date().toISOString(),
          data_saida: null,
          checkboxes: {},
        }, { onConflict: 'pedido_id,etapa' });

      if (upsertError) throw upsertError;

      // 3. Update etapa_atual
      const { error: updateError } = await supabase
        .from("pedidos_producao")
        .update({ etapa_atual: 'correcoes' })
        .eq("id", params.pedidoId);

      if (updateError) throw updateError;

      // 4. Create correcao record
      const { error: correcaoError } = await supabase
        .from("correcoes")
        .insert({
          pedido_id: params.pedidoId,
          venda_id: params.vendaId || null,
          nome_cliente: params.nomeCliente,
          endereco: params.endereco || null,
          cidade: params.cidade || '',
          estado: params.estado || '',
          cep: params.cep || null,
          telefone_cliente: params.telefoneCliente || null,
          status: 'pendente',
          created_by: userId,
        });

      if (correcaoError) throw correcaoError;

      // 5. Register movement
      await supabase
        .from("pedidos_movimentacoes")
        .insert({
          pedido_id: params.pedidoId,
          etapa_origem: etapaOrigem,
          etapa_destino: 'correcoes',
          user_id: userId || '',
          teor: 'avanco',
          descricao: params.descricaoMovimentacao || 'Pedido enviado para correção'
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      queryClient.invalidateQueries({ queryKey: ["correcoes_sem_data"] });
      queryClient.invalidateQueries({ queryKey: ["correcoes_calendario"] });
      toast.success("Pedido enviado para correção!");
    },
    onError: (error) => {
      console.error("Erro ao enviar para correção:", error);
      toast.error("Erro ao enviar pedido para correção");
    },
  });

  return {
    enviarParaCorrecao: mutation.mutateAsync,
    isEnviando: mutation.isPending,
  };
};
