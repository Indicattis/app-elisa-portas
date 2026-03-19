import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ItemNaoConcluido {
  id: string;
  nome_produto: string;
  quantidade: number;
  tamanho: string | null;
  estoque_nome: string | null;
  pedido_numero: number | null;
  etapa_atual: string | null;
}

export function useItensNaoConcluidosPorEtapa() {
  const query = useQuery({
    queryKey: ["itens-nao-concluidos-por-etapa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedido_linhas")
        .select(`
          id,
          nome_produto,
          quantidade,
          tamanho,
          estoque:estoque_id (nome_produto),
          pedidos_producao:pedido_id (numero_pedido, etapa_atual)
        `);

      if (error) {
        console.error("Erro ao buscar itens por etapa:", error);
        return [];
      }

      return (data || [])
        .filter((row: any) => row.pedidos_producao?.etapa_atual)
        .map((row: any) => ({
          id: row.id,
          nome_produto: row.nome_produto,
          quantidade: row.quantidade,
          tamanho: row.tamanho,
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
