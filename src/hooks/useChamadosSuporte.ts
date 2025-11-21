import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChamadoSuporte, ChamadosFilters } from "@/types/suporte";
import { toast } from "sonner";

export function useChamadosSuporte(filters: ChamadosFilters = {}) {
  const queryClient = useQueryClient();

  const { data: chamados, isLoading } = useQuery({
    queryKey: ["chamados-suporte", filters],
    queryFn: async () => {
      let query = supabase
        .from("chamados_suporte")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.nome) {
        query = query.ilike("nome", `%${filters.nome}%`);
      }
      if (filters.cpf) {
        query = query.ilike("cpf", `%${filters.cpf}%`);
      }
      if (filters.telefone) {
        query = query.ilike("telefone", `%${filters.telefone}%`);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.dataInicio) {
        query = query.gte("created_at", filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte("created_at", filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ChamadoSuporte[];
    },
  });

  const updateNotas = useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      const { error } = await supabase
        .from("chamados_suporte")
        .update({ notas, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados-suporte"] });
      toast.success("Notas atualizadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar notas");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pendente" | "cancelado" | "resolvido";
    }) => {
      const { error } = await supabase
        .from("chamados_suporte")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados-suporte"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const contadores = {
    total: chamados?.length || 0,
    pendentes: chamados?.filter((c) => c.status === "pendente").length || 0,
    resolvidos: chamados?.filter((c) => c.status === "resolvido").length || 0,
    cancelados: chamados?.filter((c) => c.status === "cancelado").length || 0,
  };

  return {
    chamados: chamados || [],
    isLoading,
    updateNotas,
    updateStatus,
    contadores,
  };
}
