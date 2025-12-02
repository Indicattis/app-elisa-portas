import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingColaborador {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  total_pontos: number;
  total_ordens: number;
}

export type TipoRanking = 'pintura' | 'perfiladeira' | 'solda';

export function useRankingPintura() {
  return useQuery({
    queryKey: ['ranking-pintura'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ranking_pintura_mes');
      
      if (error) {
        console.error('Erro ao buscar ranking pintura:', error);
        throw error;
      }
      
      return (data || []) as RankingColaborador[];
    },
    refetchInterval: 60000,
  });
}

export function useRankingPerfiladeira() {
  return useQuery({
    queryKey: ['ranking-perfiladeira'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ranking_perfiladeira_mes');
      
      if (error) {
        console.error('Erro ao buscar ranking perfiladeira:', error);
        throw error;
      }
      
      return (data || []) as RankingColaborador[];
    },
    refetchInterval: 60000,
  });
}

export function useRankingSolda() {
  return useQuery({
    queryKey: ['ranking-solda'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ranking_solda_mes');
      
      if (error) {
        console.error('Erro ao buscar ranking solda:', error);
        throw error;
      }
      
      return (data || []) as RankingColaborador[];
    },
    refetchInterval: 60000,
  });
}
