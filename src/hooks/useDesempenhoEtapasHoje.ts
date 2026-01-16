import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DesempenhoColaboradorHoje {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  perfiladas: number;
  perfiladeira_metros: number;
  soldadas: number;
  separadas: number;
  pintura_m2: number;
  carregamentos: number;
}

export function useDesempenhoEtapasHoje() {
  return useQuery({
    queryKey: ["desempenho-etapas-hoje"],
    queryFn: async (): Promise<DesempenhoColaboradorHoje[]> => {
      const { data, error } = await supabase.rpc("get_desempenho_etapas_hoje");

      if (error) {
        console.error("Erro ao buscar desempenho do dia:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        foto_perfil_url: item.foto_perfil_url,
        perfiladas: Number(item.perfiladas) || 0,
        perfiladeira_metros: Number(item.perfiladeira_metros) || 0,
        soldadas: Number(item.soldadas) || 0,
        separadas: Number(item.separadas) || 0,
        pintura_m2: Number(item.pintura_m2) || 0,
        carregamentos: Number(item.carregamentos) || 0,
      }));
    },
    refetchInterval: 30000,
  });
}
