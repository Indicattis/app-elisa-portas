import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrdensParadas() {
  return useQuery({
    queryKey: ["ordens-paradas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ordens_paradas");
      
      if (error) {
        console.error("Erro ao buscar ordens paradas:", error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 30000,
  });
}
