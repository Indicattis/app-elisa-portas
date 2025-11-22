import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePedidosNaFila() {
  return useQuery({
    queryKey: ["pedidos-na-fila"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pedidos_na_fila");
      
      if (error) {
        console.error("Erro ao buscar pedidos na fila:", error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 30000,
  });
}
