import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PortasPorEtapa {
  portas_perfiladas: number;
  portas_soldadas: number;
  portas_separadas: number;
  metragem_perfilada: number;
  pintura_m2_hoje: number;
  carregamentos_hoje: number;
}

export function usePortasPorEtapaHoje() {
  return useQuery({
    queryKey: ["portas-por-etapa-hoje"],
    queryFn: async (): Promise<PortasPorEtapa> => {
      const { data, error } = await supabase.rpc("get_portas_por_etapa_hoje");
      
      if (error) {
        console.error("Erro ao buscar portas por etapa:", error);
        return {
          portas_perfiladas: 0,
          portas_soldadas: 0,
          portas_separadas: 0,
          metragem_perfilada: 0,
          pintura_m2_hoje: 0,
          carregamentos_hoje: 0,
        };
      }
      
      const result = data?.[0] || {
        portas_perfiladas: 0,
        portas_soldadas: 0,
        portas_separadas: 0,
        metragem_perfilada: 0,
        pintura_m2_hoje: 0,
        carregamentos_hoje: 0,
      };
      
      return result;
    },
    refetchInterval: 30000,
  });
}
