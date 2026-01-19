import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DesempenhoColaborador {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  perfiladas_metros: number;
  soldadas: number;
  soldadas_p: number;
  soldadas_g: number;
  separadas: number;
  pintura_m2: number;
  carregamentos: number;
}

export function useDesempenhoEtapas(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["desempenho-etapas", dataInicio, dataFim],
    queryFn: async (): Promise<DesempenhoColaborador[]> => {
      const { data, error } = await supabase.rpc("get_desempenho_etapas", {
        p_data_inicio: dataInicio,
        p_data_fim: dataFim
      });
      
      if (error) {
        console.error("Erro ao buscar desempenho por etapa:", error);
        return [];
      }
      
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      return data.map((item: Record<string, unknown>) => ({
        user_id: String(item.user_id || ''),
        nome: String(item.nome || ''),
        foto_perfil_url: item.foto_perfil_url ? String(item.foto_perfil_url) : null,
        perfiladas_metros: Number(item.perfiladas_metros) || 0,
        soldadas: Number(item.soldadas) || 0,
        soldadas_p: Number(item.soldadas_p) || 0,
        soldadas_g: Number(item.soldadas_g) || 0,
        separadas: Number(item.separadas) || 0,
        pintura_m2: Number(item.pintura_m2) || 0,
        carregamentos: Number(item.carregamentos) || 0,
      }));
    },
    refetchInterval: 30000,
  });
}
