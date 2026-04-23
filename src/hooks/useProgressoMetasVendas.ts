import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMetasVendas, type MetaVendas, type MetaVendasTier } from './useMetasVendas';
import { getInicioFimSemana, getInicioFimMes } from '@/lib/periodoMeta';

export interface VendedorProgresso {
  vendedor_id: string;
  nome: string;
  total_vendido: number;
  tier_atingido: MetaVendasTier | null;
  bonificacao_calculada: number;
}

export interface MetaProgresso {
  meta: MetaVendas;
  tiers: MetaVendasTier[];
  vendedores: VendedorProgresso[];
  totalGlobal: number;
}

function calcularTier(total: number, tiers: MetaVendasTier[]): MetaVendasTier | null {
  const ordenados = [...tiers].sort((a, b) => Number(b.valor_alvo) - Number(a.valor_alvo));
  return ordenados.find((t) => total >= Number(t.valor_alvo)) || null;
}

function calcularBonificacao(total: number, tier: MetaVendasTier | null): number {
  if (!tier) return 0;
  if (tier.bonificacao_tipo === 'fixo') return Number(tier.bonificacao_valor);
  return total * (Number(tier.bonificacao_valor) / 100);
}

export function useProgressoMetasVendas() {
  const { data: metas, isLoading: loadingMetas } = useMetasVendas();

  const query = useQuery({
    queryKey: ['progresso_metas_vendas', metas?.map((m) => m.id).join(',')],
    enabled: !!metas,
    refetchInterval: 30000,
    queryFn: async (): Promise<MetaProgresso[]> => {
      const hoje = new Date();
      const hojeStr = hoje.toISOString().slice(0, 10);
      const ativas = (metas || []).filter((m) => {
        if (!m.ativa) return false;
        if (m.data_inicio_vigencia && m.data_inicio_vigencia > hojeStr) return false;
        if (m.data_fim_vigencia && m.data_fim_vigencia < hojeStr) return false;
        return true;
      });

      if (ativas.length === 0) return [];

      // Buscar nomes de atendentes
      const { data: usuarios } = await supabase
        .from('admin_users')
        .select('user_id, nome')
        .eq('ativo', true);
      const nomeMap = new Map<string, string>();
      (usuarios || []).forEach((u: any) => nomeMap.set(u.user_id, u.nome));

      const resultados: MetaProgresso[] = [];

      for (const meta of ativas) {
        const periodo = meta.periodo === 'semanal' ? getInicioFimSemana(hoje) : getInicioFimMes(hoje);

        let q = supabase
          .from('vendas')
          .select('atendente_id, valor_venda')
          .eq('is_rascunho', false)
          .gte('data_venda', periodo.inicioIso)
          .lte('data_venda', periodo.fimIso);

        if (meta.escopo === 'individual' && meta.vendedor_id) {
          q = q.eq('atendente_id', meta.vendedor_id);
        }

        const { data: vendas, error } = await q;
        if (error) throw error;

        const tiers = meta.tiers || [];
        const porVendedor = new Map<string, number>();
        let totalGlobal = 0;
        for (const v of (vendas as any[]) || []) {
          const valor = Number(v.valor_venda || 0);
          totalGlobal += valor;
          porVendedor.set(v.atendente_id, (porVendedor.get(v.atendente_id) || 0) + valor);
        }

        let vendedores: VendedorProgresso[] = [];
        if (meta.escopo === 'individual') {
          if (meta.vendedor_id) {
            const total = porVendedor.get(meta.vendedor_id) || 0;
            const tier = calcularTier(total, tiers);
            vendedores = [{
              vendedor_id: meta.vendedor_id,
              nome: nomeMap.get(meta.vendedor_id) || 'Vendedor',
              total_vendido: total,
              tier_atingido: tier,
              bonificacao_calculada: calcularBonificacao(total, tier),
            }];
          } else {
            vendedores = Array.from(porVendedor.entries())
              .map(([vid, total]) => {
                const tier = calcularTier(total, tiers);
                return {
                  vendedor_id: vid,
                  nome: nomeMap.get(vid) || 'Vendedor',
                  total_vendido: total,
                  tier_atingido: tier,
                  bonificacao_calculada: calcularBonificacao(total, tier),
                };
              })
              .sort((a, b) => b.total_vendido - a.total_vendido);
          }
        } else {
          const tier = calcularTier(totalGlobal, tiers);
          vendedores = [{
            vendedor_id: 'global',
            nome: 'Equipe',
            total_vendido: totalGlobal,
            tier_atingido: tier,
            bonificacao_calculada: calcularBonificacao(totalGlobal, tier),
          }];
        }

        resultados.push({ meta, tiers, vendedores, totalGlobal });
      }

      return resultados;
    },
  });

  return { ...query, isLoading: loadingMetas || query.isLoading };
}

export function useVendedoresElegiveis() {
  return useQuery({
    queryKey: ['vendedores_elegiveis_metas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, role')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return (data || []) as { user_id: string; nome: string; role: string }[];
    },
  });
}