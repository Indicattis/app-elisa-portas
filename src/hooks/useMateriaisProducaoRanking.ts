import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MaterialRanking {
  item: string;
  total_quantidade: number;
  ocorrencias?: number;
  metragem_m2?: number;
}

export function useMateriaisProducaoRanking() {
  const { data: rankingQuantidade = [], isLoading: isLoadingQuantidade } = useQuery({
    queryKey: ["materiais-ranking-quantidade"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_materiais_ranking_quantidade");
      
      if (error) {
        console.error("Erro ao buscar ranking por quantidade:", error);
        return [];
      }
      
      return (data || []) as MaterialRanking[];
    },
    refetchInterval: 60000, // Atualizar a cada 60 segundos
  });

  const { data: rankingMetragem = [], isLoading: isLoadingMetragem } = useQuery({
    queryKey: ["materiais-ranking-metragem"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_materiais_ranking_metragem");
      
      if (error) {
        console.error("Erro ao buscar ranking por metragem:", error);
        return [];
      }
      
      return (data || []) as MaterialRanking[];
    },
    refetchInterval: 60000,
  });

  return {
    rankingQuantidade,
    rankingMetragem,
    isLoading: isLoadingQuantidade || isLoadingMetragem,
  };
}
