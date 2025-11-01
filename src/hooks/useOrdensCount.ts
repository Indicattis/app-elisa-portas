import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrdensCount() {
  return useQuery({
    queryKey: ["ordens-count"],
    queryFn: async () => {
      // Buscar count de ordens pendentes de cada tipo
      const [soldagemRes, perfiladeiraRes, separacaoRes, qualidadeRes] = await Promise.all([
        supabase
          .from("ordens_soldagem")
          .select("id", { count: "exact", head: true })
          .neq("status", "concluido"),
        supabase
          .from("ordens_perfiladeira")
          .select("id", { count: "exact", head: true })
          .neq("status", "concluido"),
        supabase
          .from("ordens_separacao")
          .select("id", { count: "exact", head: true })
          .neq("status", "concluido"),
        supabase
          .from("ordens_qualidade")
          .select("id", { count: "exact", head: true })
          .neq("status", "concluido"),
      ]);

      return {
        soldagem: soldagemRes.count || 0,
        perfiladeira: perfiladeiraRes.count || 0,
        separacao: separacaoRes.count || 0,
        qualidade: qualidadeRes.count || 0,
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
