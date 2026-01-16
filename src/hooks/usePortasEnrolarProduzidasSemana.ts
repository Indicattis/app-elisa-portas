import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePortasEnrolarProduzidasSemana() {
  return useQuery({
    queryKey: ["portas-enrolar-produzidas-semana"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portas_enrolar_produzidas_semana");
      
      if (error) {
        console.error("Erro ao buscar portas produzidas na semana:", error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 30000,
  });
}
