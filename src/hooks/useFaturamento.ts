import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFaturamento = () => {
  const queryClient = useQueryClient();

  // Mutation para remover faturamento de uma venda
  const removerFaturamentoMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      // 1. Verificar se existe pedido vinculado
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('id, numero_pedido')
        .eq('venda_id', vendaId)
        .maybeSingle();

      if (pedidoError && pedidoError.code !== 'PGRST116') {
        throw new Error('Erro ao verificar pedido vinculado');
      }

      if (pedido) {
        throw new Error(`Existe um pedido vinculado (Pedido #${pedido.numero_pedido}). Exclua o pedido primeiro antes de remover o faturamento.`);
      }

      // 2. Resetar campos de faturamento na venda
      const { error: vendaError } = await supabase
        .from('vendas')
        .update({
          custo_total: null,
          lucro_total: null,
          frete_aprovado: false,
          valor_a_receber: null,
          valor_a_receber_faturamento: false
        })
        .eq('id', vendaId);

      if (vendaError) throw new Error('Erro ao atualizar venda: ' + vendaError.message);

      // 3. Resetar campos de faturamento nos produtos
      const { error: produtosError } = await supabase
        .from('produtos_vendas')
        .update({
          lucro_item: null,
          custo_producao: null,
          faturamento: false
        })
        .eq('venda_id', vendaId);

      if (produtosError) throw new Error('Erro ao atualizar produtos: ' + produtosError.message);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] });
      toast.success("Faturamento removido com sucesso!");
    },
    onError: (error: Error) => {
      console.error('Erro ao remover faturamento:', error);
      toast.error(error.message || "Erro ao remover faturamento");
    },
  });

  // Verificar se uma venda está faturada
  const verificarFaturamento = async (vendaId: string): Promise<{
    isFaturada: boolean;
    hasPedido: boolean;
    pedidoId: string | null;
  }> => {
    // Buscar a venda com seus produtos
    const { data: venda, error } = await supabase
      .from('vendas')
      .select('*, produtos_vendas(faturamento), frete_aprovado')
      .eq('id', vendaId)
      .single();

    if (error) throw error;

    const produtos = venda.produtos_vendas || [];
    
    // Verifica se todos os produtos estão faturados
    const todosProdutosFaturados = Array.isArray(produtos) && 
      produtos.length > 0 && 
      produtos.every((p: any) => p.faturamento === true);
    
    // Verifica se o frete foi aprovado
    const freteAprovado = venda.frete_aprovado === true;
    
    // Venda está faturada se todos os produtos estão faturados E o frete foi aprovado
    const isFaturada = todosProdutosFaturados && freteAprovado;

    // Verificar se existe pedido vinculado
    const { data: pedido } = await supabase
      .from('pedidos_producao')
      .select('id')
      .eq('venda_id', vendaId)
      .maybeSingle();

    return {
      isFaturada,
      hasPedido: !!pedido,
      pedidoId: pedido?.id || null
    };
  };

  return {
    removerFaturamento: removerFaturamentoMutation.mutateAsync,
    isRemovendo: removerFaturamentoMutation.isPending,
    verificarFaturamento,
  };
};
