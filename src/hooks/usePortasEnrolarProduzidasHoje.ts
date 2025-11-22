import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePortasEnrolarProduzidasHoje() {
  return useQuery({
    queryKey: ["portas-enrolar-produzidas-hoje"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portas_enrolar_produzidas_hoje");
      
      if (error) {
        console.error("Erro ao buscar portas produzidas hoje:", error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 60000, // Atualizar a cada 60 segundos
  });
}
