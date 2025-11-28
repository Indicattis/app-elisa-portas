import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export const useOrdensInstalacaoListagem = () => {
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens_instalacao_listagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(
          `
          *,
          venda:vendas (
            id,
            cliente_nome,
            cliente_telefone,
            cliente_cidade,
            cliente_estado
          ),
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey (
            id,
            numero_pedido,
            data_producao,
            instalacao:instalacoes (
              id,
              data_instalacao,
              hora,
              instalacao_concluida,
              instalacao_concluida_em,
              instalacao_concluida_por,
              responsavel_instalacao_id,
              responsavel_instalacao_nome,
              tipo_instalacao,
              observacoes
            )
          )
        `
        )
        .order("data_carregamento", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Erro ao buscar ordens:", error);
        throw error;
      }

      // Filtrar apenas ordens que têm instalação associada
      const filteredData = (data || []).filter((ordem: any) => {
        const instalacao = ordem.pedido?.instalacao?.[0];
        return instalacao !== undefined && instalacao !== null;
      });

      return filteredData;
    },
  });

  const concluirInstalacaoMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: instalacaoData, error: fetchError } = await supabase
        .from("instalacoes")
        .select("id")
        .eq("pedido_id", pedidoId)
        .single();

      if (fetchError) throw fetchError;
      if (!instalacaoData) throw new Error("Instalação não encontrada");

      const { error: updateError } = await supabase
        .from("instalacoes")
        .update({
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
        })
        .eq("id", instalacaoData.id);

      if (updateError) throw updateError;

      return instalacaoData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
      toast.success("Instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir instalação:", error);
      toast.error("Erro ao concluir instalação");
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channelOrdens = supabase
      .channel("ordens_carregamento_listagem")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ordens_carregamento",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_listagem"] });
        }
      )
      .subscribe();

    const channelInstalacoes = supabase
      .channel("instalacoes_listagem")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instalacoes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_listagem"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelOrdens);
      supabase.removeChannel(channelInstalacoes);
    };
  }, [queryClient]);

  return {
    ordens,
    isLoading,
    concluirInstalacao: concluirInstalacaoMutation.mutateAsync,
    isConcluindo: concluirInstalacaoMutation.isPending,
  };
};
