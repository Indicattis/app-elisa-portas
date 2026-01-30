import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProdutoConferencia {
  id: string;
  sku: string | null;
  nome_produto: string;
  categoria: string | null;
  quantidade: number;
  unidade: string | null;
  quantidade_conferida: number | null;
}

export interface ConferenciaItem {
  produto_id: string;
  quantidade_anterior: number;
  quantidade_conferida: number;
}

export const useEstoqueConferencia = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar todos os produtos ativos do estoque da fábrica
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["estoque-conferencia", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("estoque")
        .select("id, sku, nome_produto, categoria, quantidade, unidade")
        .eq("ativo", true)
        .order("nome_produto");

      if (searchTerm) {
        query = query.or(
          `nome_produto.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map((p) => ({
        ...p,
        quantidade_conferida: null,
      })) as ProdutoConferencia[];
    },
  });

  // Criar conferência e atualizar estoque
  const criarConferencia = useMutation({
    mutationFn: async ({
      itens,
      observacoes,
    }: {
      itens: ConferenciaItem[];
      observacoes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");

      // 1. Criar conferência
      const { data: conferencia, error: confError } = await supabase
        .from("estoque_conferencias")
        .insert({
          conferido_por: userData.user.id,
          observacoes,
        })
        .select()
        .single();

      if (confError) throw confError;

      // 2. Inserir itens da conferência
      const itensParaInserir = itens.map((item) => ({
        conferencia_id: conferencia.id,
        produto_id: item.produto_id,
        quantidade_anterior: item.quantidade_anterior,
        quantidade_conferida: item.quantidade_conferida,
      }));

      const { error: itensError } = await supabase
        .from("estoque_conferencia_itens")
        .insert(itensParaInserir);

      if (itensError) throw itensError;

      // 3. Atualizar quantidades no estoque e registrar movimentações
      for (const item of itens) {
        if (item.quantidade_conferida !== item.quantidade_anterior) {
          // Atualizar estoque
          const { error: updateError } = await supabase
            .from("estoque")
            .update({ quantidade: item.quantidade_conferida })
            .eq("id", item.produto_id);

          if (updateError) throw updateError;

          // Registrar movimentação
          const diferenca = item.quantidade_conferida - item.quantidade_anterior;
          const tipo = diferenca > 0 ? "entrada" : "saida";

          const { error: movError } = await supabase
            .from("estoque_movimentacoes")
            .insert({
              produto_id: item.produto_id,
              tipo_movimentacao: tipo,
              quantidade: Math.abs(diferenca),
              quantidade_anterior: item.quantidade_anterior,
              quantidade_nova: item.quantidade_conferida,
              observacoes: `Conferência de estoque #${conferencia.id.substring(0, 8)}`,
              created_by: userData.user.id,
            });

          if (movError) throw movError;
        }
      }

      return conferencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["estoque-conferencia"] });
      toast({
        title: "Conferência concluída",
        description: "O estoque foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na conferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    produtos,
    loading: isLoading,
    searchTerm,
    setSearchTerm,
    criarConferencia: criarConferencia.mutateAsync,
    criando: criarConferencia.isPending,
  };
};
