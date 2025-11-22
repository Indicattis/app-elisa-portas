import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CorPintada {
  cor_nome: string;
  quantidade_pecas: number;
}

export function useCoresPintadasHoje() {
  return useQuery({
    queryKey: ["cores-pintadas-hoje"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cores_pintadas_hoje");
      
      if (error) {
        console.error("Erro ao buscar cores pintadas hoje:", error);
        return [];
      }
      
      return (data || []) as CorPintada[];
    },
    refetchInterval: 60000,
  });
}
