import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaColaborador } from "./useMetasColaboradorIndividual";

async function calcularProgressoMeta(
  userId: string,
  meta: MetaColaborador
): Promise<number> {
  const { data_inicio, data_termino, tipo_meta } = meta;

  switch (tipo_meta) {
    case 'perfiladeira': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("metragem_linear")
        .eq("user_id", userId)
        .eq("tipo_ranking", "perfiladeira")
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.metragem_linear) || 0), 0);
    }
    case 'solda': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("porta_soldada")
        .eq("user_id", userId)
        .eq("tipo_ranking", "solda")
        .not("porta_soldada", "is", null)
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).length;
    }
    case 'separacao': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("pedido_separado")
        .eq("user_id", userId)
        .eq("tipo_ranking", "separacao")
        .not("pedido_separado", "is", null)
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.pedido_separado) || 0), 0);
    }
    case 'pintura': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("metragem_quadrada_pintada")
        .eq("user_id", userId)
        .eq("tipo_ranking", "pintura")
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.metragem_quadrada_pintada) || 0), 0);
    }
    case 'qualidade': {
      const { data } = await supabase
        .from("ordens_qualidade")
        .select("id")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino + "T23:59:59");
      return (data || []).length;
    }
    case 'carregamento': {
      const { data } = await (supabase
        .from("ordens_carregamento" as any)
        .select("id")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino + "T23:59:59") as any);
      return (data || []).length;
    }
    default:
      return 0;
  }
}

export function useMetaProgressoCalculado(userId: string, metas: MetaColaborador[]) {
  return useQuery({
    queryKey: ["metas-progresso-calculado", userId, metas.map(m => m.id).join(",")],
    queryFn: async () => {
      const progressos: Record<string, number> = {};
      for (const meta of metas) {
        progressos[meta.id] = await calcularProgressoMeta(userId, meta);
      }
      return progressos;
    },
    enabled: !!userId && metas.length > 0,
  });
}
