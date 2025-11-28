import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingColaborador {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  total_pontos: number;
  total_linhas: number;
}

export function usePontuacaoRanking() {
  return useQuery({
    queryKey: ['pontuacao-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_ranking_pontuacao_mes');
      
      if (error) {
        console.error('Erro ao buscar ranking:', error);
        throw error;
      }
      
      return (data || []) as RankingColaborador[];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}
