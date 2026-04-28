import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EtapaPedido } from "@/types/pedidoEtapa";

export interface MaterialPedido {
  estoque_id: string;
  nome_produto: string;
  descricao_produto: string | null;
  unidade: string | null;
  quantidade_necessaria: number;
  metragem_total: number;
  estoque_atual: number;
}

export interface PedidoComPendencia {
  pedido_id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: EtapaPedido;
  materiaisPendentes: MaterialPedido[];
  totalFaltantes: number;
}

export interface MaterialConsolidado {
  estoque_id: string;
  nome_produto: string;
  descricao_produto: string | null;
  unidade: string | null;
  quantidade_total: number;
  metragem_total: number;
  estoque_atual: number;
  faltante: number;
}

/**
 * Hook para gerar relatório de materiais pendentes em duas etapas:
 * 1. fetchPedidosComPendencias(etapas) — lista pedidos com material faltante
 * 2. consolidarMateriais(pedidoIds) — consolida materiais dos pedidos selecionados
 */
export function useMateriaisPendentesPorEtapa() {
  const [pedidosComPendencias, setPedidosComPendencias] = useState<PedidoComPendencia[]>([]);
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);

  const fetchPedidosComPendencias = useCallback(async (etapas: EtapaPedido[]) => {
    setIsLoadingPedidos(true);
    setErrorPedidos(null);
    try {
      // 1. Buscar pedidos nas etapas selecionadas
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos_producao")
        .select("id, numero_pedido, etapa_atual, venda_id")
        .in("etapa_atual", etapas as any);

      if (pedidosError) throw pedidosError;
      if (!pedidos || pedidos.length === 0) {
        setPedidosComPendencias([]);
        return [];
      }

      const pedidoIds = pedidos.map((p) => p.id);
      const vendaIds = pedidos.map((p) => p.venda_id).filter(Boolean) as string[];

      // 2. Buscar nomes dos clientes
      const { data: vendas } = await supabase
        .from("vendas")
        .select("id, cliente_nome")
        .in("id", vendaIds);

      const vendaMap = new Map<string, string>(
        (vendas || []).map((v: any) => [v.id, v.cliente_nome || "—"])
      );

      // 3. Buscar linhas com estoque vinculado
      const { data: linhas, error: linhasError } = await supabase
        .from("pedido_linhas")
        .select(`
          pedido_id,
          quantidade,
          largura,
          altura,
          tamanho,
          estoque_id,
          estoque:estoque_id (
            id,
            nome_produto,
            descricao_produto,
            unidade,
            quantidade
          )
        `)
        .in("pedido_id", pedidoIds)
        .not("estoque_id", "is", null);

      if (linhasError) throw linhasError;

      // 4. Agrupar por pedido + material
      const porPedido = new Map<string, Map<string, MaterialPedido>>();

      (linhas || []).forEach((linha: any) => {
        if (!linha.estoque) return;
        const pedidoId = linha.pedido_id;
        const estoqueId = linha.estoque.id;
        const quantidade = Number(linha.quantidade) || 0;

        let metragem = 0;
        if (linha.largura && linha.altura) {
          metragem = quantidade * Number(linha.largura) * Number(linha.altura);
        } else if (linha.tamanho) {
          const t = parseFloat(String(linha.tamanho).replace(",", "."));
          if (!isNaN(t)) metragem = quantidade * t;
        }

        if (!porPedido.has(pedidoId)) porPedido.set(pedidoId, new Map());
        const materiaisDoPedido = porPedido.get(pedidoId)!;

        if (materiaisDoPedido.has(estoqueId)) {
          const ex = materiaisDoPedido.get(estoqueId)!;
          ex.quantidade_necessaria += quantidade;
          ex.metragem_total += metragem;
        } else {
          materiaisDoPedido.set(estoqueId, {
            estoque_id: estoqueId,
            nome_produto: linha.estoque.nome_produto,
            descricao_produto: linha.estoque.descricao_produto,
            unidade: linha.estoque.unidade,
            quantidade_necessaria: quantidade,
            metragem_total: metragem,
            estoque_atual: Number(linha.estoque.quantidade) || 0,
          });
        }
      });

      // 5. Filtrar pedidos com pelo menos 1 material faltante
      const resultado: PedidoComPendencia[] = [];
      pedidos.forEach((p: any) => {
        const materiais = porPedido.get(p.id);
        if (!materiais) return;

        const pendentes = Array.from(materiais.values()).filter(
          (m) => m.quantidade_necessaria > m.estoque_atual
        );
        if (pendentes.length === 0) return;

        resultado.push({
          pedido_id: p.id,
          numero_pedido: p.numero_pedido || "—",
          cliente_nome: vendaMap.get(p.venda_id) || "—",
          etapa_atual: p.etapa_atual as EtapaPedido,
          materiaisPendentes: pendentes,
          totalFaltantes: pendentes.length,
        });
      });

      // Ordenar por número de pedido
      resultado.sort((a, b) => a.numero_pedido.localeCompare(b.numero_pedido));

      setPedidosComPendencias(resultado);
      return resultado;
    } catch (err: any) {
      console.error("Erro ao buscar pedidos com pendências:", err);
      setErrorPedidos(err.message || "Erro ao buscar pedidos");
      return [];
    } finally {
      setIsLoadingPedidos(false);
    }
  }, []);

  const consolidarMateriais = useCallback(
    (pedidoIdsSelecionados: string[]): MaterialConsolidado[] => {
      const consolidado = new Map<string, MaterialConsolidado>();

      pedidosComPendencias
        .filter((p) => pedidoIdsSelecionados.includes(p.pedido_id))
        .forEach((pedido) => {
          pedido.materiaisPendentes.forEach((m) => {
            if (consolidado.has(m.estoque_id)) {
              const ex = consolidado.get(m.estoque_id)!;
              ex.quantidade_total += m.quantidade_necessaria;
              ex.metragem_total += m.metragem_total;
            } else {
              consolidado.set(m.estoque_id, {
                estoque_id: m.estoque_id,
                nome_produto: m.nome_produto,
                descricao_produto: m.descricao_produto,
                unidade: m.unidade,
                quantidade_total: m.quantidade_necessaria,
                metragem_total: m.metragem_total,
                estoque_atual: m.estoque_atual,
                faltante: 0,
              });
            }
          });
        });

      // Calcular faltante após agregação completa
      return Array.from(consolidado.values())
        .map((m) => ({
          ...m,
          faltante: Math.max(0, m.quantidade_total - m.estoque_atual),
        }))
        .sort((a, b) => b.faltante - a.faltante);
    },
    [pedidosComPendencias]
  );

  const reset = useCallback(() => {
    setPedidosComPendencias([]);
    setErrorPedidos(null);
  }, []);

  return {
    pedidosComPendencias,
    isLoadingPedidos,
    errorPedidos,
    fetchPedidosComPendencias,
    consolidarMateriais,
    reset,
  };
}