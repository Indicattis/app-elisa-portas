import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ItemNaoConcluido {
  id: string;
  item: string;
  quantidade: number;
  tamanho: string | null;
  largura: number | null;
  altura: number | null;
  tipo_ordem: string;
  cor_nome: string | null;
  estoque_nome: string | null;
  pedido_numero: number | null;
  etapa_atual: string | null;
}

export function useItensNaoConcluidosPorEtapa() {
  const query = useQuery({
    queryKey: ["itens-nao-concluidos-por-etapa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linhas_ordens")
        .select(`
          id,
          item,
          quantidade,
          tamanho,
          largura,
          altura,
          tipo_ordem,
          cor_nome,
          estoque:estoque_id (nome_produto),
          pedidos_producao:pedido_id (numero_pedido, etapa_atual)
        `)
        .eq("concluida", false);

      if (error) {
        console.error("Erro ao buscar itens não concluídos:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        item: row.item,
        quantidade: row.quantidade,
        tamanho: row.tamanho,
        largura: row.largura,
        altura: row.altura,
        tipo_ordem: row.tipo_ordem,
        cor_nome: row.cor_nome,
        estoque_nome: row.estoque?.nome_produto || null,
        pedido_numero: row.pedidos_producao?.numero_pedido || null,
        etapa_atual: row.pedidos_producao?.etapa_atual || null,
      })) as ItemNaoConcluido[];
    },
  });

  const itensPorEtapa = useMemo(() => {
    const items = query.data || [];
    const grouped: Record<string, ItemNaoConcluido[]> = {};
    for (const item of items) {
      const etapa = item.etapa_atual || "sem_etapa";
      if (!grouped[etapa]) grouped[etapa] = [];
      grouped[etapa].push(item);
    }
    return grouped;
  }, [query.data]);

  return {
    itens: query.data || [],
    itensPorEtapa,
    isLoading: query.isLoading,
  };
}
