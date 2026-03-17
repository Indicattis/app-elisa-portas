import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KmHistorico {
  id: string;
  veiculo_id: string;
  km_anterior: number;
  km_novo: number;
  origem: string;
  created_at: string;
  created_by: string | null;
}

export function useVeiculoKmHistorico(veiculoId: string | undefined) {
  const { data: kmHistorico, isLoading } = useQuery({
    queryKey: ["veiculo-km-historico", veiculoId],
    queryFn: async () => {
      if (!veiculoId) return [];
      const { data, error } = await supabase
        .from("veiculos_km_historico")
        .select("*")
        .eq("veiculo_id", veiculoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as KmHistorico[];
    },
    enabled: !!veiculoId,
  });

  return { kmHistorico, isLoading };
}
