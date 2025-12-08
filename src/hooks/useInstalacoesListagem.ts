import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { InstalacaoCalendario } from "./useOrdensInstalacaoCalendario";

export const useInstalacoesListagem = () => {
  const queryClient = useQueryClient();

  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes_listagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instalacoes")
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
            bairro
          )
        `)
        .order("data_instalacao", { ascending: false, nullsFirst: true });

      if (error) {
        console.error("Erro ao buscar instalações:", error);
        throw error;
      }

      // Buscar cores das equipes separadamente
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);
      
      return (data || []).map(item => ({
        ...item,
        equipe: item.responsavel_instalacao_id 
          ? equipesMap.get(item.responsavel_instalacao_id) || null 
          : null,
        _corEquipe: item.responsavel_instalacao_id 
          ? equipesMap.get(item.responsavel_instalacao_id)?.cor || null 
          : null
      })) as InstalacaoCalendario[];
    },
  });

  const concluirInstalacaoMutation = useMutation({
    mutationFn: async (instalacaoId: string) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("instalacoes")
        .update({
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
          instalacao_concluida_por: user.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", instalacaoId);

      if (error) throw error;
      return instalacaoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
      toast.success("Instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir instalação:", error);
      toast.error("Erro ao concluir instalação");
    },
  });

  const deleteInstalacaoMutation = useMutation({
    mutationFn: async (instalacaoId: string) => {
      const { error } = await supabase
        .from("instalacoes")
        .delete()
        .eq("id", instalacaoId);

      if (error) throw error;
      return instalacaoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
      toast.success("Instalação excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir instalação:", error);
      toast.error("Erro ao excluir instalação");
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("instalacoes_listagem_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instalacoes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["instalacoes_listagem"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    instalacoes,
    isLoading,
    concluirInstalacao: concluirInstalacaoMutation.mutateAsync,
    deleteInstalacao: deleteInstalacaoMutation.mutateAsync,
    isConcluindo: concluirInstalacaoMutation.isPending,
    isDeleting: deleteInstalacaoMutation.isPending,
  };
};
