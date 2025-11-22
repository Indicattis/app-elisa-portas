import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instalacao, InstalacaoFormData } from "@/types/instalacao";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const useInstalacoes = (startDate?: Date, viewMode: 'week' | 'month' = 'week') => {
  const queryClient = useQueryClient();

  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes", startDate?.toISOString(), viewMode],
    queryFn: async () => {
      let query = supabase
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
            data_venda
          ),
          equipe:equipes_instalacao(
            id,
            nome,
            cor,
            ativa
          )
        `)
        .order("data", { ascending: true })
        .order("hora", { ascending: true });

      if (startDate) {
        let start: Date;
        let end: Date;
        
        if (viewMode === 'month') {
          // Para modo mensal, buscar desde o início do mês até o final
          const monthStart = startOfMonth(startDate);
          const monthEnd = endOfMonth(startDate);
          // Expandir para incluir semanas completas no calendário
          start = startOfWeek(monthStart, { weekStartsOn: 0 });
          end = endOfWeek(monthEnd, { weekStartsOn: 0 });
        } else {
          // Para modo semanal, buscar apenas a semana
          start = startOfWeek(startDate, { weekStartsOn: 0 });
          end = endOfWeek(startDate, { weekStartsOn: 0 });
        }
        
        query = query
          .gte("data", start.toISOString().split("T")[0])
          .lte("data", end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Instalacao[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (instalacao: InstalacaoFormData) => {
      const { data, error } = await supabase
        .from("instalacoes")
        .insert([{
          ...instalacao,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação cadastrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar instalação:", error);
      toast.error("Erro ao cadastrar instalação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InstalacaoFormData> }) => {
      const { data: updated, error } = await supabase
        .from("instalacoes")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar instalação:", error);
      toast.error("Erro ao atualizar instalação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instalacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar instalação:", error);
      toast.error("Erro ao remover instalação");
    },
  });

  return {
    instalacoes,
    isLoading,
    createInstalacao: createMutation.mutateAsync,
    updateInstalacao: updateMutation.mutateAsync,
    deleteInstalacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
