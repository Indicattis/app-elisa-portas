import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMetaProducaoMes() {
  return useQuery({
    queryKey: ["meta-producao-mes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_meta_producao_mes");
      
      if (error) {
        console.error("Erro ao buscar meta de produção do mês:", error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 60000,
  });
}
