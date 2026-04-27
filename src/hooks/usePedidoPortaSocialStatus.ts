import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PedidoPortaSocialStatus {
  id: string;
  numero_ordem: string;
  status: string;
  em_backlog: boolean;
  delegado_para_id: string | null;
  delegado_em: string | null;
  admin_users?: {
    nome: string;
    foto_perfil_url?: string | null;
  } | null;
}

export function usePedidoPortaSocialStatus(pedidoId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["pedido-porta-social-status", pedidoId],
    enabled: !!pedidoId && enabled,
    queryFn: async (): Promise<PedidoPortaSocialStatus | null> => {
      const { data, error } = await supabase
        .from("ordens_porta_social")
        .select(`
          id,
          numero_ordem,
          status,
          em_backlog,
          delegado_para_id,
          delegado_em,
          admin_users:delegado_para_id ( nome, foto_perfil_url )
        `)
        .eq("pedido_id", pedidoId!)
        .eq("historico", false)
        .maybeSingle();

      if (error) throw error;
      return (data as any) ?? null;
    },
  });
}
