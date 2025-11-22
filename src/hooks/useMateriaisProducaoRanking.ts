import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MaterialRanking {
  item: string;
  total_quantidade: number;
  metragem_m2: number;
  ocorrencias: number;
}

export function useMateriaisProducaoRanking() {
  const { data: rankingCompleto = [], isLoading } = useQuery({
    queryKey: ["materiais-ranking-completo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_materiais_ranking_completo");
      
      if (error) {
        console.error("Erro ao buscar ranking completo:", error);
        return [];
      }
      
      return (data || []) as MaterialRanking[];
    },
    refetchInterval: 60000, // Atualizar a cada 60 segundos
  });

  return {
    rankingCompleto,
    isLoading,
  };
}
