import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DesempenhoProducao {
  data: string;
  dia_semana: string;
  portas_perfiladas: number;
  portas_soldadas: number;
  portas_separadas: number;
  portas_pintadas: number;
  portas_carregadas: number;
}

export function useDesempenhoProducaoGeral(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: ["desempenho-producao-geral", format(dataInicio, "yyyy-MM-dd"), format(dataFim, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_desempenho_producao_geral", {
        p_data_inicio: format(dataInicio, "yyyy-MM-dd"),
        p_data_fim: format(dataFim, "yyyy-MM-dd"),
      });
      
      if (error) {
        console.error("Erro ao buscar desempenho de produção:", error);
        return [];
      }
      
      return (data || []) as DesempenhoProducao[];
    },
    refetchInterval: 60000,
  });
}
