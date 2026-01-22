import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EtapaPedido } from "@/types/pedidoEtapa";

export interface EtapaResponsavel {
  id: string;
  etapa: EtapaPedido;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
  responsavel?: {
    user_id: string;
    nome: string;
    email: string;
    foto_perfil_url: string | null;
    setor: string | null;
  } | null;
}

export function useEtapaResponsaveis() {
  const queryClient = useQueryClient();

  const { data: responsaveis = [], isLoading } = useQuery({
    queryKey: ["etapa-responsaveis"],
    queryFn: async () => {
      // Buscar responsáveis das etapas
      const { data: etapaData, error: etapaError } = await supabase
        .from("etapa_responsaveis")
        .select("*");

      if (etapaError) throw etapaError;

      // Buscar dados dos usuários responsáveis
      const responsavelIds = etapaData
        ?.map((e) => e.responsavel_id)
        .filter(Boolean) as string[];

      if (responsavelIds.length === 0) {
        return (etapaData || []).map((e) => ({
          ...e,
          etapa: e.etapa as EtapaPedido,
          responsavel: null,
        })) as EtapaResponsavel[];
      }

      const { data: usuarios, error: usuariosError } = await supabase
        .from("admin_users")
        .select("user_id, nome, email, foto_perfil_url, setor")
        .in("user_id", responsavelIds);

      if (usuariosError) throw usuariosError;

      // Combinar dados
      return (etapaData || []).map((e) => ({
        ...e,
        etapa: e.etapa as EtapaPedido,
        responsavel: usuarios?.find((u) => u.user_id === e.responsavel_id) || null,
      })) as EtapaResponsavel[];
    },
  });

  const atribuirResponsavelMutation = useMutation({
    mutationFn: async ({
      etapa,
      responsavelId,
    }: {
      etapa: EtapaPedido;
      responsavelId: string;
    }) => {
      // Verificar se já existe registro para esta etapa
      const { data: existing } = await supabase
        .from("etapa_responsaveis")
        .select("id")
        .eq("etapa", etapa)
        .single();

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from("etapa_responsaveis")
          .update({ responsavel_id: responsavelId, updated_at: new Date().toISOString() })
          .eq("etapa", etapa);

        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from("etapa_responsaveis")
          .insert({ etapa, responsavel_id: responsavelId });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapa-responsaveis"] });
      toast.success("Responsável atribuído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atribuir responsável:", error);
      toast.error("Erro ao atribuir responsável");
    },
  });

  const removerResponsavelMutation = useMutation({
    mutationFn: async (etapa: EtapaPedido) => {
      const { error } = await supabase
        .from("etapa_responsaveis")
        .delete()
        .eq("etapa", etapa);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapa-responsaveis"] });
      toast.success("Responsável removido!");
    },
    onError: (error) => {
      console.error("Erro ao remover responsável:", error);
      toast.error("Erro ao remover responsável");
    },
  });

  // Helper para obter responsável de uma etapa específica
  const getResponsavel = (etapa: EtapaPedido) => {
    return responsaveis.find((r) => r.etapa === etapa)?.responsavel || null;
  };

  return {
    responsaveis,
    isLoading,
    getResponsavel,
    atribuirResponsavel: atribuirResponsavelMutation.mutate,
    isAtribuindo: atribuirResponsavelMutation.isPending,
    removerResponsavel: removerResponsavelMutation.mutate,
    isRemovendo: removerResponsavelMutation.isPending,
  };
}
