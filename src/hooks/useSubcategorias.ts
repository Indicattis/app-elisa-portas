import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Subcategoria {
  id: string;
  nome: string;
  categoria_id: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface SubcategoriaInput {
  nome: string;
  categoria_id: string;
  descricao?: string;
  ordem?: number;
}

export const useSubcategorias = (categoriaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subcategorias = [], isLoading } = useQuery({
    queryKey: ["estoque-subcategorias", categoriaId],
    queryFn: async () => {
      let query = supabase
        .from("estoque_subcategorias")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (categoriaId) {
        query = query.eq("categoria_id", categoriaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Subcategoria[];
    },
    enabled: categoriaId !== undefined,
  });

  const adicionarSubcategoria = useMutation({
    mutationFn: async (subcategoria: SubcategoriaInput) => {
      const { data, error } = await supabase
        .from("estoque_subcategorias")
        .insert(subcategoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-subcategorias"] });
      toast({
        title: "Subcategoria adicionada",
        description: "A subcategoria foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar subcategoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editarSubcategoria = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subcategoria> & { id: string }) => {
      const { data, error } = await supabase
        .from("estoque_subcategorias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-subcategorias"] });
      toast({
        title: "Subcategoria atualizada",
        description: "A subcategoria foi atualizada com sucesso.",
      });
    },
  });

  const removerSubcategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estoque_subcategorias")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-subcategorias"] });
      toast({
        title: "Subcategoria removida",
        description: "A subcategoria foi desativada com sucesso.",
      });
    },
  });

  return {
    subcategorias,
    loading: isLoading,
    adicionarSubcategoria: adicionarSubcategoria.mutateAsync,
    editarSubcategoria: editarSubcategoria.mutateAsync,
    removerSubcategoria: removerSubcategoria.mutateAsync,
  };
};
