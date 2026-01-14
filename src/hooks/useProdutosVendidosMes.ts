import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export interface ProdutoVendidoMes {
  catalogo_id: string;
  nome_produto: string;
  categoria: string | null;
  quantidade_total: number;
  valor_total: number;
}

export interface UseProdutosVendidosMesParams {
  dataInicio?: Date;
  dataFim?: Date;
  atendenteId?: string;
}

export function useProdutosVendidosMes(params: UseProdutosVendidosMesParams = {}) {
  const hoje = new Date();
  const inicioMes = params.dataInicio ? params.dataInicio.toISOString() : startOfMonth(hoje).toISOString();
  const fimMes = params.dataFim ? params.dataFim.toISOString() : endOfMonth(hoje).toISOString();
  const atendenteId = params.atendenteId;

  return useQuery({
    queryKey: ["produtos-catalogo-vendidos-mes", inicioMes, fimMes, atendenteId],
    queryFn: async () => {
      // Buscar produtos vendidos no período que têm vínculo com o catálogo
      let query = supabase
        .from("produtos_vendas")
        .select(`
          vendas_catalogo_id,
          quantidade,
          valor_total,
          vendas!inner(data_venda, atendente_id)
        `)
        .not("vendas_catalogo_id", "is", null)
        .gte("vendas.data_venda", inicioMes)
        .lte("vendas.data_venda", fimMes);

      if (atendenteId && atendenteId !== "todos") {
        query = query.eq("vendas.atendente_id", atendenteId);
      }

      const { data: produtosVendas, error } = await query;

      if (error) throw error;

      // Buscar informações dos produtos do catálogo
      const catalogoIds = [...new Set(
        produtosVendas?.map(p => p.vendas_catalogo_id).filter(Boolean) || []
      )];

      if (catalogoIds.length === 0) return [];

      const { data: catalogo } = await supabase
        .from("vendas_catalogo")
        .select("id, nome_produto, categoria")
        .in("id", catalogoIds);

      const catalogoMap = (catalogo || []).reduce((acc, item) => {
        acc[item.id] = { nome: item.nome_produto, categoria: item.categoria };
        return acc;
      }, {} as Record<string, { nome: string; categoria: string | null }>);

      // Agrupar por produto do catálogo
      const agrupado = (produtosVendas || []).reduce((acc, item) => {
        const catalogoId = item.vendas_catalogo_id!;
        const info = catalogoMap[catalogoId];
        
        if (!info) return acc;
        
        if (!acc[catalogoId]) {
          acc[catalogoId] = {
            catalogo_id: catalogoId,
            nome_produto: info.nome,
            categoria: info.categoria,
            quantidade_total: 0,
            valor_total: 0,
          };
        }
        
        acc[catalogoId].quantidade_total += item.quantidade || 0;
        acc[catalogoId].valor_total += item.valor_total || 0;
        
        return acc;
      }, {} as Record<string, ProdutoVendidoMes>);

      // Converter para array e ordenar por quantidade
      return Object.values(agrupado).sort(
        (a, b) => b.quantidade_total - a.quantidade_total
      );
    },
  });
}
