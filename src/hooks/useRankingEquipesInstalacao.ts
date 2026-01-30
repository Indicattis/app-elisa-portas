import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

export type PeriodoFiltro = 'mes' | 'ano' | 'todos';

export interface RankingEquipe {
  equipe_id: string;
  equipe_nome: string;
  equipe_cor: string | null;
  quantidade_instalacoes: number;
  metragem_total: number;
  ultima_instalacao: string | null;
}

export function useRankingEquipesInstalacao() {
  const [ranking, setRanking] = useState<RankingEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  const fetchRanking = async () => {
    try {
      setLoading(true);

      // Calcular datas de filtro
      const now = new Date();
      let dataInicio: Date | null = null;
      let dataFim: Date | null = null;

      if (periodo === 'mes') {
        dataInicio = startOfMonth(now);
        dataFim = endOfMonth(now);
      } else if (periodo === 'ano') {
        dataInicio = startOfYear(now);
        dataFim = endOfYear(now);
      }

      // Buscar instalações concluídas com responsável (equipe interna)
      let query = supabase
        .from('instalacoes')
        .select(`
          responsavel_instalacao_id,
          metragem_quadrada,
          instalacao_concluida_em,
          equipe:equipes_instalacao!instalacoes_responsavel_instalacao_id_fkey (
            id,
            nome,
            cor,
            ativa
          )
        `)
        .eq('instalacao_concluida', true)
        .not('responsavel_instalacao_id', 'is', null);

      // Aplicar filtro de período
      if (dataInicio && dataFim) {
        query = query
          .gte('instalacao_concluida_em', dataInicio.toISOString())
          .lte('instalacao_concluida_em', dataFim.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por equipe e calcular métricas
      const agrupamento = new Map<string, {
        equipe_id: string;
        equipe_nome: string;
        equipe_cor: string | null;
        quantidade_instalacoes: number;
        metragem_total: number;
        ultima_instalacao: string | null;
      }>();

      (data || []).forEach((instalacao: any) => {
        const equipe = instalacao.equipe;
        if (!equipe || !equipe.ativa) return;

        const equipeId = equipe.id;
        
        if (!agrupamento.has(equipeId)) {
          agrupamento.set(equipeId, {
            equipe_id: equipeId,
            equipe_nome: equipe.nome,
            equipe_cor: equipe.cor,
            quantidade_instalacoes: 0,
            metragem_total: 0,
            ultima_instalacao: null
          });
        }

        const item = agrupamento.get(equipeId)!;
        item.quantidade_instalacoes += 1;
        item.metragem_total += instalacao.metragem_quadrada || 0;
        
        if (!item.ultima_instalacao || 
            (instalacao.instalacao_concluida_em && instalacao.instalacao_concluida_em > item.ultima_instalacao)) {
          item.ultima_instalacao = instalacao.instalacao_concluida_em;
        }
      });

      // Converter para array e ordenar por quantidade de instalações
      const rankingArray = Array.from(agrupamento.values())
        .sort((a, b) => b.quantidade_instalacoes - a.quantidade_instalacoes);

      setRanking(rankingArray);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      toast.error('Erro ao carregar ranking das equipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [periodo]);

  const maxInstalacoes = useMemo(() => {
    if (ranking.length === 0) return 0;
    return ranking[0].quantidade_instalacoes;
  }, [ranking]);

  return {
    ranking,
    loading,
    periodo,
    setPeriodo,
    maxInstalacoes,
    refetch: fetchRanking
  };
}
