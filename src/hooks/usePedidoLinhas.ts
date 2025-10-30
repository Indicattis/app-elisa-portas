import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CategoriaLinha = 'separacao' | 'solda' | 'perfiladeira';

export interface PedidoLinha {
  id: string;
  pedido_id: string;
  estoque_id: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  ordem: number;
  tamanho: string | null;
  categoria_linha: CategoriaLinha;
  check_separacao: boolean;
  check_qualidade: boolean;
  check_coleta: boolean;
  created_at: string;
  updated_at: string;
}

export interface PedidoLinhaNova {
  nome_produto: string;
  descricao_produto?: string;
  quantidade: number;
  tamanho?: string;
  estoque_id?: string;
  categoria_linha: CategoriaLinha;
}

export function usePedidoLinhas(pedidoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar linhas do pedido
  const { data: linhas = [], isLoading } = useQuery({
    queryKey: ['pedido-linhas', pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_linhas')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return (data || []) as PedidoLinha[];
    },
    enabled: !!pedidoId
  });

  // Mutation para popular automaticamente separação com acessórios e adicionais
  const popularLinhasSeparacao = useMutation({
    mutationFn: async (vendaId: string) => {
      // Verificar se já existem linhas de separação
      const existingCount = linhas.filter(l => l.categoria_linha === 'separacao').length;
      if (existingCount > 0) return;

      // Buscar acessórios e adicionais da venda
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_vendas')
        .select('*')
        .eq('venda_id', vendaId)
        .in('tipo_produto', ['acessorio', 'adicional']);

      if (produtosError) throw produtosError;
      if (!produtos || produtos.length === 0) return;

      // Calcular próxima ordem
      const proximaOrdem = linhas.length > 0 
        ? Math.max(...linhas.map(l => l.ordem)) + 1 
        : 1;

      // Inserir todas as linhas
      const linhasParaInserir = produtos.map((p, idx) => ({
        pedido_id: pedidoId,
        nome_produto: p.descricao,
        descricao_produto: p.descricao,
        quantidade: p.quantidade,
        categoria_linha: 'separacao' as CategoriaLinha,
        ordem: proximaOrdem + idx,
        check_separacao: false,
        check_qualidade: false,
        check_coleta: false,
      }));

      const { error: insertError } = await supabase
        .from('pedido_linhas')
        .insert(linhasParaInserir);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      toast({
        title: "Linhas de separação populadas",
        description: "Acessórios e adicionais foram adicionados automaticamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao popular linhas",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para adicionar linha
  const adicionarLinha = useMutation({
    mutationFn: async (linha: PedidoLinhaNova) => {
      // Calcular próxima ordem
      const proximaOrdem = linhas.length > 0 
        ? Math.max(...linhas.map(l => l.ordem)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('pedido_linhas')
        .insert({
          pedido_id: pedidoId,
          nome_produto: linha.nome_produto,
          descricao_produto: linha.descricao_produto,
          quantidade: linha.quantidade,
          tamanho: linha.tamanho,
          estoque_id: linha.estoque_id,
          categoria_linha: linha.categoria_linha,
          ordem: proximaOrdem,
          check_separacao: false,
          check_qualidade: false,
          check_coleta: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado ao pedido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para remover linha
  const removerLinha = useMutation({
    mutationFn: async (linhaId: string) => {
      const { error } = await supabase
        .from('pedido_linhas')
        .delete()
        .eq('id', linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido do pedido.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar checkbox
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ linhaId, campo, valor }: { linhaId: string; campo: string; valor: boolean }) => {
      const { error } = await supabase
        .from('pedido_linhas')
        .update({ [campo]: valor })
        .eq('id', linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar checkbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    linhas,
    isLoading,
    adicionarLinha: adicionarLinha.mutateAsync,
    removerLinha: removerLinha.mutateAsync,
    atualizarCheckbox: atualizarCheckbox.mutateAsync,
    popularLinhasSeparacao: popularLinhasSeparacao.mutateAsync,
  };
}
