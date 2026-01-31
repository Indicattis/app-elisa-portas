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
        .from("ordens_perfiladeira")
        .select("metragem_linear")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.metragem_linear) || 0), 0);
    }
    case 'solda': {
      const { data } = await supabase
        .from("ordens_soldagem")
        .select("qtd_portas_p, qtd_portas_g")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.qtd_portas_p) || 0) + (Number(item.qtd_portas_g) || 0), 0);
    }
    case 'separacao': {
      const { data } = await supabase
        .from("ordens_separacao")
        .select("quantidade_itens")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.quantidade_itens) || 0), 0);
    }
    case 'qualidade': {
      const { data } = await supabase
        .from("ordens_qualidade")
        .select("id")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).length;
    }
    case 'pintura': {
      const { data } = await supabase
        .from("ordens_pintura")
        .select("metragem_quadrada")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc: number, item: any) => 
        acc + (Number(item.metragem_quadrada) || 0), 0);
    }
    case 'carregamento': {
      const { data } = await (supabase
        .from("ordens_carregamento" as any)
        .select("id")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino) as any);
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
