import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PedidoLinha {
  id: string;
  pedido_id: string;
  estoque_id: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  ordem: number;
  tamanho: string | null;
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
  };
}
