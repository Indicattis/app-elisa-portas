import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcularFaturamentoLiquido, isVendaValida } from "@/utils/faturamentoCalc";

export interface RankingVendedor {
  atendente_id: string;
  atendente_nome: string;
  foto_perfil_url: string | null;
  quantidade_vendas: number;
  quantidade_portas: number;
  valor_total: number;
}

export const useRankingAnual = (year: number) => {
  return useQuery({
    queryKey: ['ranking-anual', year],
    queryFn: async () => {
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          atendente_id,
          valor_venda,
          valor_frete,
          valor_credito,
          data_venda,
          admin_users!fk_vendas_atendente(nome, foto_perfil_url),
          produtos_vendas(id)
        `)
        .gte('data_venda', `${year}-01-01`)
        .lte('data_venda', `${year}-12-31`);

      if (error) throw error;

      // Agrupar por atendente
      const rankingMap = new Map<string, RankingVendedor>();

      vendas?.forEach((venda: any) => {
        if (!isVendaValida(venda)) return;
        const atendenteId = venda.atendente_id;
        const atendenteNome = venda.admin_users?.nome || 'Sem atendente';
        const fotoPerfil = venda.admin_users?.foto_perfil_url || null;
        const quantidadeProdutos = venda.produtos_vendas?.length || 0;
        const valorSemFrete = calcularFaturamentoLiquido(venda);

        if (!rankingMap.has(atendenteId)) {
          rankingMap.set(atendenteId, {
            atendente_id: atendenteId,
            atendente_nome: atendenteNome,
            foto_perfil_url: fotoPerfil,
            quantidade_vendas: 0,
            quantidade_portas: 0,
            valor_total: 0
          });
        }

        const vendedor = rankingMap.get(atendenteId)!;
        vendedor.quantidade_vendas += 1;
        vendedor.quantidade_portas += quantidadeProdutos;
        vendedor.valor_total += valorSemFrete;
      });

      // Ordenar por valor total
      return Array.from(rankingMap.values())
        .sort((a, b) => b.valor_total - a.valor_total);
    },
    refetchInterval: 60000
  });
};
