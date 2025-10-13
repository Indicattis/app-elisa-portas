import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProdutoVenda } from "./useVendas";

export const useProdutosVenda = (vendaId?: string) => {
  const queryClient = useQueryClient();

  // Buscar produtos de uma venda específica
  const { data: produtos, isLoading, refetch } = useQuery({
    queryKey: ['produtos-venda', vendaId],
    queryFn: async () => {
      if (!vendaId) return [];
      
      const { data, error } = await supabase
        .from('produtos_vendas')
        .select(`
          *,
          catalogo_cores(nome, codigo_hex)
        `)
        .eq('venda_id', vendaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendaId,
  });

  // Adicionar produto
  const addProdutoMutation = useMutation({
    mutationFn: async (produto: ProdutoVenda & { venda_id: string }) => {
      // Limpar campos UUID vazios e garantir valores default
      const produtoLimpo = {
        ...produto,
        tamanho: produto.tamanho || '',
        cor_id: produto.cor_id || null,
        acessorio_id: produto.acessorio_id || null,
        adicional_id: produto.adicional_id || null,
      };

      const { data, error } = await supabase
        .from('produtos_vendas')
        .insert([produtoLimpo])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success("Produto adicionado com sucesso!");
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar produto:', error);
      toast.error("Erro ao adicionar produto");
    },
  });

  // Remover produto
  const deleteProdutoMutation = useMutation({
    mutationFn: async (produtoId: string) => {
      const { error } = await supabase
        .from('produtos_vendas')
        .delete()
        .eq('id', produtoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success("Produto removido com sucesso!");
    },
    onError: (error: any) => {
      console.error('Erro ao remover produto:', error);
      toast.error("Erro ao remover produto");
    },
  });

  // Atualizar lucro do produto
  const updateLucroItemMutation = useMutation({
    mutationFn: async ({ 
      produtoId, 
      lucroItem,
      custoProducao
    }: { 
      produtoId: string; 
      lucroItem: number;
      custoProducao: number;
    }) => {
      // Simplesmente atualizar os valores sem recalcular
      const { data, error } = await supabase
        .from('produtos_vendas')
        .update({ 
          lucro_item: lucroItem,
          custo_producao: custoProducao
        })
        .eq('id', produtoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success("Lucro atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar lucro:', error);
      toast.error("Erro ao atualizar lucro");
    },
  });

  // Mutation para finalizar faturamento da venda
  const finalizarFaturamentoMutation = useMutation({
    mutationFn: async ({ 
      vendaId, 
      custoTotal, 
      lucroTotal 
    }: { 
      vendaId: string; 
      custoTotal: number; 
      lucroTotal: number;
    }) => {
      const { error } = await supabase
        .from('vendas')
        .update({ 
          custo_total: custoTotal,
          lucro_total: lucroTotal
        })
        .eq('id', vendaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
      toast.success("Faturamento finalizado com sucesso!");
    },
    onError: (error: any) => {
      console.error('Erro ao finalizar faturamento:', error);
      toast.error("Erro ao finalizar faturamento");
    },
  });

  return {
    produtos: produtos || [],
    isLoading,
    refetch,
    addProduto: addProdutoMutation.mutate,
    isAdding: addProdutoMutation.isPending,
    deleteProduto: deleteProdutoMutation.mutate,
    isDeleting: deleteProdutoMutation.isPending,
    updateLucroItem: updateLucroItemMutation.mutate,
    isUpdatingLucro: updateLucroItemMutation.isPending,
    finalizarFaturamento: finalizarFaturamentoMutation.mutate,
    isFinalizandoFaturamento: finalizarFaturamentoMutation.isPending,
  };
};
