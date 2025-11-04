import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Despesa {
  id: string;
  mes: string;
  nome: string;
  categoria: string;
  modalidade: 'fixa' | 'variavel';
  valor_esperado: number;
  valor_real: number;
  observacoes: string | null;
}

export interface DespesaFormData {
  mes: string;
  nome: string;
  categoria: string;
  modalidade: 'fixa' | 'variavel';
  valor_esperado: number;
  valor_real: number;
  observacoes: string;
}

export const useDespesas = (mes: string) => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDespesas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("despesas_mensais")
        .select("*")
        .eq("mes", mes)
        .order("modalidade", { ascending: true })
        .order("categoria", { ascending: true });

      if (error) throw error;
      setDespesas((data || []) as Despesa[]);
    } catch (error: any) {
      toast.error("Erro ao carregar despesas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveDespesa = async (data: DespesaFormData) => {
    try {
      const { error } = await supabase
        .from("despesas_mensais")
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }]);

      if (error) throw error;
      toast.success("Despesa cadastrada com sucesso!");
      await fetchDespesas();
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar despesa");
      console.error(error);
      return false;
    }
  };

  const updateDespesa = async (id: string, data: Partial<DespesaFormData>) => {
    try {
      const { error } = await supabase
        .from("despesas_mensais")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      toast.success("Despesa atualizada com sucesso!");
      await fetchDespesas();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar despesa");
      console.error(error);
      return false;
    }
  };

  const deleteDespesa = async (id: string) => {
    try {
      const { error } = await supabase
        .from("despesas_mensais")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Despesa excluída com sucesso!");
      await fetchDespesas();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir despesa");
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    if (mes) {
      fetchDespesas();
    }
  }, [mes]);

  return {
    despesas,
    loading,
    saveDespesa,
    updateDespesa,
    deleteDespesa,
    refetch: fetchDespesas,
  };
};
