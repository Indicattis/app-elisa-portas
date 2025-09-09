import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutorizadoRating {
  id: string;
  autorizado_id: string;
  atendente_id: string;
  categoria: 'instalacao' | 'suporte' | 'atendimento';
  nota: number;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingData {
  autorizado_id: string;
  categoria: 'instalacao' | 'suporte' | 'atendimento';
  nota: number;
  descricao?: string;
}

export function useAutorizadosRatings(autorizadoId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ratingsQuery = useQuery({
    queryKey: ['autorizado-ratings', autorizadoId],
    queryFn: async () => {
      if (!autorizadoId) return [];
      
      const { data, error } = await supabase
        .from('autorizados_ratings')
        .select(`
          *,
          atendente:admin_users!atendente_id(nome)
        `)
        .eq('autorizado_id', autorizadoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!autorizadoId,
  });

  const createRatingMutation = useMutation({
    mutationFn: async (ratingData: CreateRatingData) => {
      const { data, error } = await supabase
        .from('autorizados_ratings')
        .insert([{
          ...ratingData,
          atendente_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizado-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['autorizados-with-ratings'] });
      toast({
        title: "Avaliação salva",
        description: "A avaliação foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    ratings: ratingsQuery.data || [],
    isLoading: ratingsQuery.isLoading,
    error: ratingsQuery.error,
    createRating: createRatingMutation.mutate,
    isCreating: createRatingMutation.isPending,
  };
}

// Hook para buscar autorizados com ratings agregados
export function useAutorizadosWithRatings() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['autorizados-with-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autorizados')
        .select(`
          *,
          ratings:autorizados_ratings(nota)
        `)
        .order('nome');

      if (error) throw error;

      return (data || []).map(autorizado => {
        const ratings = autorizado.ratings || [];
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.nota, 0) / totalRatings 
          : 0;

        return {
          ...autorizado,
          average_rating: Number(averageRating.toFixed(1)),
          total_ratings: totalRatings,
        };
      });
    },
    retry: 1,
  });
}