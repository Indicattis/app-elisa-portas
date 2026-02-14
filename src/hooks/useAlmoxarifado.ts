import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface AlmoxarifadoItem {
  id: string;
  nome: string;
  fornecedor_id: string | null;
  quantidade_minima: number;
  quantidade_maxima: number;
  quantidade_estoque: number;
  data_ultima_conferencia: string | null;
  custo: number;
  unidade: string;
  ativo: boolean;
  conferir_estoque: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Campo calculado
  total_estoque?: number;
  // Join
  fornecedor?: {
    nome: string;
  } | null;
}

export interface AlmoxarifadoFormData {
  nome: string;
  fornecedor_id?: string | null;
  quantidade_minima: number;
  quantidade_maxima: number;
  quantidade_estoque: number;
  data_ultima_conferencia?: string | null;
  custo: number;
  unidade: string;
  conferir_estoque?: boolean;
}

export const useAlmoxarifado = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["almoxarifado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("almoxarifado")
        .select(`
          *,
          fornecedor:fornecedores(nome)
        `)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      
      // Calcular total_estoque para cada item
      return (data || []).map(item => ({
        ...item,
        total_estoque: item.custo * item.quantidade_estoque
      })) as AlmoxarifadoItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: AlmoxarifadoFormData) => {
      const { data, error } = await supabase
        .from("almoxarifado")
        .insert([{ ...item, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["almoxarifado"] });
      toast({
        title: "Item criado",
        description: "Item do almoxarifado cadastrado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AlmoxarifadoItem> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from("almoxarifado")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["almoxarifado"] });
      toast({
        title: "Item atualizado",
        description: "Item do almoxarifado atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("almoxarifado")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["almoxarifado"] });
      toast({
        title: "Item excluído",
        description: "Item do almoxarifado excluído com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    items,
    isLoading,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
