import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePortasVenda(vendaId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portas, isLoading, refetch } = useQuery({
    queryKey: ['portas-venda', vendaId],
    queryFn: async () => {
      if (!vendaId) return [];
      
      const { data, error } = await supabase
        .from('portas_vendas')
        .select(`
          *,
          cor:catalogo_cores(nome, codigo_hex)
        `)
        .eq('venda_id', vendaId)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
    enabled: !!vendaId
  });

  const addPortaMutation = useMutation({
    mutationFn: async (portaData: any) => {
      if (!vendaId) throw new Error('ID da venda não fornecido');
      
      const { data, error } = await supabase
        .from('portas_vendas')
        .insert([{ ...portaData, venda_id: vendaId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portas-venda', vendaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Porta adicionada',
        description: 'A porta foi adicionada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar porta',
        description: error.message,
      });
    }
  });

  const deletePortaMutation = useMutation({
    mutationFn: async (portaId: string) => {
      const { error } = await supabase
        .from('portas_vendas')
        .delete()
        .eq('id', portaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portas-venda', vendaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Porta removida',
        description: 'A porta foi removida com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover porta',
        description: error.message,
      });
    }
  });

  const updateLucroItemMutation = useMutation({
    mutationFn: async ({ portaId, lucro_item }: { portaId: string; lucro_item: number }) => {
      // Buscar os dados da porta para calcular a distribuição de lucro
      const { data: porta, error: fetchError } = await supabase
        .from('portas_vendas')
        .select('valor_total, valor_produto, valor_pintura, tipo_produto')
        .eq('id', portaId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Preparar objeto de atualização
      const updateData: any = {
        lucro_item
      };
      
      // Distribuir lucro entre produto e pintura proporcionalmente
      if (porta.tipo_produto === 'pintura_epoxi') {
        // Para pintura_epoxi, o valor pode estar em valor_produto (dados antigos) ou valor_pintura (correto)
        const valorReal = porta.valor_pintura > 0 ? porta.valor_pintura : porta.valor_produto;
        
        // Garantir que lucro não excede o valor disponível
        const lucroAjustado = Math.min(lucro_item, valorReal);
        
        updateData.lucro_produto = null;
        updateData.lucro_pintura = lucroAjustado;
      } else if (porta.valor_pintura && porta.valor_pintura > 0) {
        // Se tem produto e pintura, dividir proporcionalmente
        const totalValor = (porta.valor_produto || 0) + (porta.valor_pintura || 0);
        if (totalValor > 0) {
          updateData.lucro_produto = lucro_item * ((porta.valor_produto || 0) / totalValor);
          updateData.lucro_pintura = lucro_item * ((porta.valor_pintura || 0) / totalValor);
        } else {
          updateData.lucro_produto = 0;
          updateData.lucro_pintura = null;
        }
      } else {
        // Se for só produto, todo o lucro vai para produto
        updateData.lucro_produto = lucro_item;
        updateData.lucro_pintura = null;
      }
      
      // Atualizar com lucro_item e distribuição de lucros
      // Os custos serão calculados automaticamente como colunas geradas
      const { error } = await supabase
        .from('portas_vendas')
        .update(updateData)
        .eq('id', portaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portas-venda', vendaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Lucro atualizado',
        description: 'O lucro foi salvo com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lucro',
        description: error.message,
      });
    }
  });

  return {
    portas,
    isLoading,
    refetch,
    addPorta: addPortaMutation.mutateAsync,
    deletePorta: deletePortaMutation.mutateAsync,
    updateLucroItem: updateLucroItemMutation.mutateAsync,
    isAdding: addPortaMutation.isPending,
    isDeleting: deletePortaMutation.isPending,
    isUpdatingLucros: updateLucroItemMutation.isPending
  };
}
