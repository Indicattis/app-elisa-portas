import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PortasPorEtapa {
  metros_perfilados: number;
  portas_soldadas: number;
  pedidos_separados: number;
  pintura_m2: number;
  carregamentos: number;
}

export function usePortasPorEtapa(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["portas-por-etapa", dataInicio, dataFim],
    queryFn: async (): Promise<PortasPorEtapa> => {
      const { data, error } = await supabase.rpc("get_portas_por_etapa", {
        data_inicio: dataInicio,
        data_fim: dataFim
      });
      
      if (error) {
        console.error("Erro ao buscar portas por etapa:", error);
        return {
          metros_perfilados: 0,
          portas_soldadas: 0,
          pedidos_separados: 0,
          pintura_m2: 0,
          carregamentos: 0,
        };
      }
      
      const result = data?.[0] || {
        metros_perfilados: 0,
        portas_soldadas: 0,
        pedidos_separados: 0,
        pintura_m2: 0,
        carregamentos: 0,
      };
      
      return result;
    },
    refetchInterval: 30000,
  });
}
