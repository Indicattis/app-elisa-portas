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

  const updateLucrosMutation = useMutation({
    mutationFn: async ({ portaId, lucro_produto, lucro_pintura }: { portaId: string; lucro_produto: number; lucro_pintura: number }) => {
      const { error } = await supabase
        .from('portas_vendas')
        .update({ lucro_produto, lucro_pintura })
        .eq('id', portaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portas-venda', vendaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Lucros atualizados',
        description: 'Os lucros foram salvos com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lucros',
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
    updateLucros: updateLucrosMutation.mutateAsync,
    isAdding: addPortaMutation.isPending,
    isDeleting: deletePortaMutation.isPending,
    isUpdatingLucros: updateLucrosMutation.isPending
  };
}
