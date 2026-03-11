import { useState, useEffect } from "react";
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
  cargo: UserRole;
  justificativa: string;
}

export const useVagas = () => {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVagas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vagas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVagas((data || []) as Vaga[]);
    } catch (error: any) {
      toast.error("Erro ao carregar vagas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      await fetchVagas();
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
      await fetchVagas();
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
      await fetchVagas();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir vaga");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    fetchVagas();
  }, []);

  return {
    vagas,
    loading,
    createVaga,
    updateVagaStatus,
    deleteVaga,
    refetch: fetchVagas,
  };
};
