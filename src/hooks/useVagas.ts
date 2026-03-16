import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StatusVaga = 'em_analise' | 'aberta' | 'fechada' | 'preenchida';

export interface Vaga {
  id: string;
  cargo: string;
  justificativa: string;
  status: StatusVaga;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VagaFormData {
  cargo: string;
  justificativa: string;
}

const VAGAS_QUERY_KEY = ["vagas"];

const fetchVagas = async (): Promise<Vaga[]> => {
  const { data, error } = await supabase
    .from("vagas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Vaga[];
};

export const useVagas = () => {
  const queryClient = useQueryClient();

  const { data: vagas = [], isLoading: loading } = useQuery({
    queryKey: VAGAS_QUERY_KEY,
    queryFn: fetchVagas,
  });

  const createVaga = async (formData: VagaFormData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("vagas")
        .insert([{
          ...formData,
          created_by: user.user.id,
          status: 'em_analise' as StatusVaga,
        }]);

      if (error) throw error;
      toast.success("Solicitação de vaga criada com sucesso!");
      await queryClient.invalidateQueries({ queryKey: VAGAS_QUERY_KEY });
      return true;
    } catch (error: any) {
      toast.error("Erro ao criar vaga");
      console.error(error);
      return false;
    }
  };

  const updateVagaStatus = async (id: string, status: StatusVaga) => {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status da vaga atualizado com sucesso!");
      await queryClient.invalidateQueries({ queryKey: VAGAS_QUERY_KEY });
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar status");
      console.error(error);
      return false;
    }
  };

  const deleteVaga = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vagas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Vaga excluída com sucesso!");
      await queryClient.invalidateQueries({ queryKey: VAGAS_QUERY_KEY });
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir vaga");
      console.error(error);
      return false;
    }
  };

  return {
    vagas,
    loading,
    createVaga,
    updateVagaStatus,
    deleteVaga,
    refetch: () => queryClient.invalidateQueries({ queryKey: VAGAS_QUERY_KEY }),
  };
};
