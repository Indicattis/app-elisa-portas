import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export interface ProdutoVendidoMes {
  nome_produto: string;
  tipo_produto: string;
  quantidade_total: number;
  valor_total: number;
}

export function useProdutosVendidosMes() {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje).toISOString();
  const fimMes = endOfMonth(hoje).toISOString();

  return useQuery({
    queryKey: ["produtos-vendidos-mes", inicioMes],
    queryFn: async () => {
      // Buscar produtos vendidos no mês atual
      const { data: produtosVendas, error } = await supabase
        .from("produtos_vendas")
        .select(`
          tipo_produto,
          quantidade,
          valor_total,
          vendas_catalogo_id,
          vendas!inner(data_venda)
        `)
        .gte("vendas.data_venda", inicioMes)
        .lte("vendas.data_venda", fimMes);

      if (error) throw error;

      // Buscar nomes dos produtos do catálogo
      const catalogoIds = [...new Set(
        produtosVendas
          ?.filter(p => p.vendas_catalogo_id)
          .map(p => p.vendas_catalogo_id) || []
      )];

      let catalogoMap: Record<string, string> = {};
      
      if (catalogoIds.length > 0) {
        const { data: catalogo } = await supabase
          .from("vendas_catalogo")
          .select("id, nome_produto")
          .in("id", catalogoIds);
        
        catalogoMap = (catalogo || []).reduce((acc, item) => {
          acc[item.id] = item.nome_produto;
          return acc;
        }, {} as Record<string, string>);
      }

      // Agrupar por produto
      const agrupado = (produtosVendas || []).reduce((acc, item) => {
        const nomeProduto = item.vendas_catalogo_id 
          ? catalogoMap[item.vendas_catalogo_id] || item.tipo_produto
          : item.tipo_produto;
        
        const key = `${nomeProduto}__${item.tipo_produto}`;
        
        if (!acc[key]) {
          acc[key] = {
            nome_produto: nomeProduto,
            tipo_produto: item.tipo_produto,
            quantidade_total: 0,
            valor_total: 0,
          };
        }
        
        acc[key].quantidade_total += item.quantidade || 0;
        acc[key].valor_total += item.valor_total || 0;
        
        return acc;
      }, {} as Record<string, ProdutoVendidoMes>);

      // Converter para array e ordenar por quantidade
      return Object.values(agrupado).sort(
        (a, b) => b.quantidade_total - a.quantidade_total
      );
    },
  });
}

// Labels amigáveis para tipos de produto
export const TIPO_PRODUTO_LABELS: Record<string, string> = {
  porta_enrolar: "Porta de Enrolar",
  adicional: "Adicional",
  acessorio: "Acessório",
  pintura_epoxi: "Pintura Epóxi",
  manutencao: "Manutenção",
  porta_seccionada: "Porta Seccionada",
  porta_rapida: "Porta Rápida",
  porta_vidro: "Porta de Vidro",
  automatizacao: "Automatização",
  outro: "Outro",
};

export function getTipoProdutoLabel(tipo: string): string {
  return TIPO_PRODUTO_LABELS[tipo] || tipo;
}
