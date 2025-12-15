import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrdensCount() {
  return useQuery({
    queryKey: ["ordens-count"],
    queryFn: async () => {
      // Buscar ordens pendentes de cada tipo e contar no cliente
      const [soldagemRes, perfiladeiraRes, separacaoRes, qualidadeRes, pinturaRes, carregamentoRes] = await Promise.all([
        supabase
          .from("ordens_soldagem")
          .select("id")
          .neq("status", "concluido"),
        supabase
          .from("ordens_perfiladeira")
          .select("id")
          .neq("status", "concluido"),
        supabase
          .from("ordens_separacao")
          .select("id")
          .neq("status", "concluido"),
        supabase
          .from("ordens_qualidade")
          .select("id")
          .neq("status", "concluido"),
        supabase
          .from("ordens_pintura")
          .select("id")
          .neq("status", "pronta"),
        supabase
          .from("ordens_carregamento")
          .select("id")
          .neq("status", "concluido"),
      ]);

      return {
        solda: soldagemRes.data?.length || 0,
        perfiladeira: perfiladeiraRes.data?.length || 0,
        separacao: separacaoRes.data?.length || 0,
        qualidade: qualidadeRes.data?.length || 0,
        pintura: pinturaRes.data?.length || 0,
        carregamento: carregamentoRes.data?.length || 0,
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
