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

      // 1. Buscar todas as equipes ativas primeiro
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes_instalacao')
        .select('id, nome, cor, ativa')
        .eq('ativa', true);

      if (equipesError) throw equipesError;

      // Criar mapa de equipes para lookup rápido
      const equipesMap = new Map(
        (equipesData || []).map(eq => [eq.id, eq])
      );

      // 2. Buscar instalações vinculadas a pedidos (equipes internas - tipo_instalacao = 'elisa')
      let queryInstalacoes = supabase
        .from('instalacoes')
        .select(`
          responsavel_instalacao_id,
          metragem_quadrada,
          instalacao_concluida_em
        `)
        .eq('instalacao_concluida', true)
        .eq('tipo_instalacao', 'elisa')
        .not('responsavel_instalacao_id', 'is', null)
        .not('pedido_id', 'is', null); // Apenas instalações vinculadas a pedidos

      // 3. Buscar neo instalações concluídas por equipes internas
      let queryNeoInstalacoes = supabase
        .from('neo_instalacoes')
        .select(`
          equipe_id,
          concluida_em
        `)
        .eq('concluida', true)
        .eq('tipo_responsavel', 'equipe_interna')
        .not('equipe_id', 'is', null);

      // Aplicar filtro de período em ambas as queries
      if (dataInicio && dataFim) {
        queryInstalacoes = queryInstalacoes
          .gte('instalacao_concluida_em', dataInicio.toISOString())
          .lte('instalacao_concluida_em', dataFim.toISOString());
        
        queryNeoInstalacoes = queryNeoInstalacoes
          .gte('concluida_em', dataInicio.toISOString())
          .lte('concluida_em', dataFim.toISOString());
      }

      // Executar ambas as queries em paralelo
      const [instalacoesResult, neoInstalacoesResult] = await Promise.all([
        queryInstalacoes,
        queryNeoInstalacoes
      ]);

      if (instalacoesResult.error) throw instalacoesResult.error;
      if (neoInstalacoesResult.error) throw neoInstalacoesResult.error;

      const instalacoesData = instalacoesResult.data || [];
      const neoInstalacoesData = neoInstalacoesResult.data || [];

      // 4. Agrupar por equipe e calcular métricas
      const agrupamento = new Map<string, {
        equipe_id: string;
        equipe_nome: string;
        equipe_cor: string | null;
        quantidade_instalacoes: number;
        metragem_total: number;
        ultima_instalacao: string | null;
      }>();

      // Processar instalações de pedidos (têm metragem)
      instalacoesData.forEach((instalacao: any) => {
        const equipe = equipesMap.get(instalacao.responsavel_instalacao_id);
        if (!equipe) return;

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

      // Processar neo instalações (não têm metragem)
      neoInstalacoesData.forEach((neo: any) => {
        const equipe = equipesMap.get(neo.equipe_id);
        if (!equipe) return;

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
        // Neo instalações não têm metragem, então não incrementamos
        
        if (!item.ultima_instalacao || 
            (neo.concluida_em && neo.concluida_em > item.ultima_instalacao)) {
          item.ultima_instalacao = neo.concluida_em;
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
