import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CategoriaLinha = 'separacao' | 'solda' | 'perfiladeira';

export interface PedidoLinha {
  id: string;
  pedido_id: string;
  produto_venda_id: string | null;
  estoque_id: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  ordem: number;
  tamanho: string | null;
  largura: number | null;
  altura: number | null;
  categoria_linha: CategoriaLinha;
  tipo_ordem: string | null;
  check_separacao: boolean;
  check_qualidade: boolean;
  check_coleta: boolean;
  created_at: string;
  updated_at: string;
}

export interface PedidoLinhaNova {
  produto_venda_id: string;
  nome_produto: string;
  descricao_produto?: string;
  quantidade: number;
  tamanho?: string;
  largura?: number;
  altura?: number;
  estoque_id?: string;
  categoria_linha: CategoriaLinha;
}

export interface PedidoLinhaUpdate {
  id: string;
  estoque_id?: string;
  nome_produto?: string;
  descricao_produto?: string;
  quantidade?: number;
  largura?: number;
  altura?: number;
  tamanho?: string;
  tipo_ordem?: string;
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

      // Se tiver estoque_id, buscar o setor_responsavel_producao para usar como tipo_ordem
      let tipoOrdem = null;
      if (linha.estoque_id) {
        const { data: produtoEstoque } = await supabase
          .from('estoque')
          .select('setor_responsavel_producao')
          .eq('id', linha.estoque_id)
          .single();
        
        tipoOrdem = produtoEstoque?.setor_responsavel_producao || null;
      }

      const { data, error } = await supabase
        .from('pedido_linhas')
        .insert({
          pedido_id: pedidoId,
          produto_venda_id: linha.produto_venda_id,
          nome_produto: linha.nome_produto,
          descricao_produto: linha.descricao_produto,
          quantidade: linha.quantidade,
          tamanho: linha.tamanho,
          largura: linha.largura,
          altura: linha.altura,
          estoque_id: linha.estoque_id,
          categoria_linha: linha.categoria_linha,
          tipo_ordem: tipoOrdem,
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
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas-count', pedidoId] });
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
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas-count', pedidoId] });
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

  const atualizarLinha = useMutation({
    mutationFn: async (update: PedidoLinhaUpdate) => {
      const { id, ...campos } = update;
      const { error } = await supabase
        .from('pedido_linhas')
        .update(campos)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar linha",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const atualizarLinhasEmLote = useMutation({
    mutationFn: async (updates: PedidoLinhaUpdate[]) => {
      if (updates.length === 0) {
        throw new Error('Nenhuma atualização para processar.');
      }

      const promises = updates.map(async (update) => {
        const { id, ...campos } = update;
        return supabase
          .from('pedido_linhas')
          .update(campos)
          .eq('id', id);
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Erros ao atualizar linhas:', errors);
        const errorMessages = errors.map(e => e.error?.message || 'Erro desconhecido').join(', ');
        throw new Error(`Falha ao atualizar ${errors.length} linha(s): ${errorMessages}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      toast({
        title: "Linhas atualizadas",
        description: "Todas as alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar alterações",
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
    atualizarLinha: atualizarLinha.mutateAsync,
    atualizarLinhasEmLote: atualizarLinhasEmLote.mutateAsync,
  };
}
