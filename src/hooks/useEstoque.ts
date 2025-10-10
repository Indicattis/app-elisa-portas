import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProdutoEstoque {
  id: string;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  unidade: string;
  ativo: boolean;
}

export interface ProdutoEstoqueInput {
  nome_produto: string;
  descricao_produto?: string;
  quantidade: number;
  unidade?: string;
}

export const useEstoque = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["estoque", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("estoque")
        .select("*")
        .eq("ativo", true)
        .order("nome_produto");

      if (searchTerm) {
        query = query.or(
          `nome_produto.ilike.%${searchTerm}%,descricao_produto.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProdutoEstoque[];
    },
  });

  const adicionarProduto = useMutation({
    mutationFn: async (produto: ProdutoEstoqueInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("estoque")
        .insert({
          ...produto,
          created_by: userData?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado ao estoque com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const buscarProdutos = async (termo: string) => {
    setSearchTerm(termo);
  };

  return {
    produtos,
    loading: isLoading,
    buscarProdutos,
    adicionarProduto: adicionarProduto.mutateAsync,
  };
};
