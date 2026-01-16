import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MaterialNecessario {
  estoque_id: string;
  nome_produto: string;
  descricao_produto: string | null;
  unidade: string | null;
  quantidade_necessaria: number;
  metragem_total: number;
  estoque_atual: number;
  ocorrencias: number;
}

export function useMateriaisNecessariosProducao() {
  return useQuery({
    queryKey: ["materiais-necessarios-producao"],
    queryFn: async (): Promise<MaterialNecessario[]> => {
      // 1. Buscar pedidos em produção
      const { data: pedidosEmProducao, error: pedidosError } = await supabase
        .from("pedidos_producao")
        .select("id")
        .eq("etapa_atual", "em_producao");

      if (pedidosError) throw pedidosError;
      if (!pedidosEmProducao || pedidosEmProducao.length === 0) return [];

      const pedidoIds = pedidosEmProducao.map((p) => p.id);

      // 2. Buscar linhas desses pedidos com estoque vinculado
      const { data: linhas, error: linhasError } = await supabase
        .from("pedido_linhas")
        .select(`
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
      if (!linhas || linhas.length === 0) return [];

      // 3. Agregar por material
      const materiaisMap = new Map<string, MaterialNecessario>();

      linhas.forEach((linha: any) => {
        if (!linha.estoque) return;

        const estoqueId = linha.estoque.id;
        const quantidade = linha.quantidade || 0;

        // Calcular metragem
        let metragem = 0;
        if (linha.largura && linha.altura) {
          metragem = quantidade * linha.largura * linha.altura;
        } else if (linha.tamanho) {
          const tamanhoNum = parseFloat(String(linha.tamanho).replace(",", "."));
          if (!isNaN(tamanhoNum)) {
            metragem = quantidade * tamanhoNum;
          }
        }

        if (materiaisMap.has(estoqueId)) {
          const existing = materiaisMap.get(estoqueId)!;
          existing.quantidade_necessaria += quantidade;
          existing.metragem_total += metragem;
          existing.ocorrencias += 1;
        } else {
          materiaisMap.set(estoqueId, {
            estoque_id: estoqueId,
            nome_produto: linha.estoque.nome_produto,
            descricao_produto: linha.estoque.descricao_produto,
            unidade: linha.estoque.unidade,
            quantidade_necessaria: quantidade,
            metragem_total: metragem,
            estoque_atual: linha.estoque.quantidade || 0,
            ocorrencias: 1,
          });
        }
      });

      // 4. Ordenar por quantidade necessária (decrescente)
      return Array.from(materiaisMap.values()).sort(
        (a, b) => b.quantidade_necessaria - a.quantidade_necessaria
      );
    },
    refetchInterval: 60000, // Atualiza a cada 60 segundos
  });
}
