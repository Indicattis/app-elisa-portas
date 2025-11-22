import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrdemStatus {
  existe: boolean;
  status: string | null;
  capturada: boolean;
}

interface PedidoComOrdens {
  numero_pedido: string;
  etapa_atual: string;
  ordens: {
    soldagem: OrdemStatus;
    perfiladeira: OrdemStatus;
    separacao: OrdemStatus;
    qualidade: OrdemStatus;
    pintura: OrdemStatus;
  };
}

export function usePedidosComOrdens() {
  return useQuery({
    queryKey: ["pedidos-com-ordens"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pedidos_com_status_ordens");
      
      if (error) {
        console.error("Erro ao buscar pedidos com ordens:", error);
        return [];
      }
      
      return (data || []) as unknown as PedidoComOrdens[];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
