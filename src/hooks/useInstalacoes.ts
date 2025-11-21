import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instalacao, InstalacaoFormData } from "@/types/instalacao";
import { startOfWeek, endOfWeek } from "date-fns";

export const useInstalacoes = (startDate?: Date) => {
  const queryClient = useQueryClient();

  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes", startDate?.toISOString()],
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
          )
        `)
        .order("data", { ascending: true })
        .order("hora", { ascending: true });

      if (startDate) {
        const start = startOfWeek(startDate, { weekStartsOn: 0 });
        const end = endOfWeek(startDate, { weekStartsOn: 0 });
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
