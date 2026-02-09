import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrdemProgress(pedidoId: string | undefined) {
  return useQuery({
    queryKey: ["ordem-progress", pedidoId],
    queryFn: async () => {
      if (!pedidoId) return { concluidas: 0, total: 0 };

      const [soldagem, perfiladeira, separacao, qualidade, pintura, portaSocial] = await Promise.all([
        supabase
          .from("ordens_soldagem")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .maybeSingle(),
        supabase
          .from("ordens_perfiladeira")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .maybeSingle(),
        supabase
          .from("ordens_separacao")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .maybeSingle(),
        supabase
          .from("ordens_qualidade")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .maybeSingle(),
        supabase
          .from("ordens_pintura")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .maybeSingle(),
        supabase
          .from("ordens_porta_social")
          .select("id, status")
          .eq("pedido_id", pedidoId)
          .eq("historico", false)
          .maybeSingle(),
      ]);

      const ordens = [
        soldagem.data,
        perfiladeira.data,
        separacao.data,
        qualidade.data,
        pintura.data,
        portaSocial.data,
      ].filter(Boolean);

      const total = ordens.length;
      const concluidas = ordens.filter(
        (o: any) => o.status === "concluido" || o.status === "pronta"
      ).length;

      return { concluidas, total };
    },
    enabled: !!pedidoId,
    staleTime: 30000,
  });
}
