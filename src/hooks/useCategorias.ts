import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export interface CategoriaInput {
  nome: string;
  cor: string;
  ordem?: number;
}

export const useCategorias = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["estoque-categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_categorias")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (error) throw error;
      return data as Categoria[];
    },
  });

  const adicionarCategoria = useMutation({
    mutationFn: async (categoria: CategoriaInput) => {
      const { data, error } = await supabase
        .from("estoque_categorias")
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-categorias"] });
      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editarCategoria = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Categoria> & { id: string }) => {
      const { data, error } = await supabase
        .from("estoque_categorias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-categorias"] });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removerCategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estoque_categorias")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-categorias"] });
      toast({
        title: "Categoria removida",
        description: "A categoria foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    categorias,
    loading: isLoading,
    adicionarCategoria: adicionarCategoria.mutateAsync,
    editarCategoria: editarCategoria.mutateAsync,
    removerCategoria: removerCategoria.mutateAsync,
  };
};
