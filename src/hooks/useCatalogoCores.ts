import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CatalogoCor {
  id: string;
  nome: string;
  codigo_hex: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogoCorInput {
  nome: string;
  codigo_hex: string;
  ativa?: boolean;
}

export function useCatalogoCores() {
  const queryClient = useQueryClient();

  const { data: cores = [], isLoading } = useQuery({
    queryKey: ["catalogo-cores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as CatalogoCor[];
    },
  });

  const adicionarCor = useMutation({
    mutationFn: async (input: CatalogoCorInput) => {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .insert({
          nome: input.nome,
          codigo_hex: input.codigo_hex,
          ativa: input.ativa ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo-cores"] });
      toast.success("Cor adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar cor:", error);
      toast.error("Erro ao adicionar cor");
    },
  });

  const editarCor = useMutation({
    mutationFn: async ({ id, ...input }: CatalogoCorInput & { id: string }) => {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .update({
          nome: input.nome,
          codigo_hex: input.codigo_hex,
          ativa: input.ativa,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo-cores"] });
      toast.success("Cor atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao editar cor:", error);
      toast.error("Erro ao atualizar cor");
    },
  });

  const toggleAtiva = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .update({ ativa, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["catalogo-cores"] });
      toast.success(data.ativa ? "Cor ativada!" : "Cor desativada!");
    },
    onError: (error) => {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status da cor");
    },
  });

  const coresAtivas = cores.filter((cor) => cor.ativa);

  return {
    cores,
    coresAtivas,
    isLoading,
    adicionarCor,
    editarCor,
    toggleAtiva,
  };
}
