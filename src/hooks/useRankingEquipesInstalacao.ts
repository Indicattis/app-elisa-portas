import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

export type PeriodoFiltro = 'mes' | 'ano' | 'todos';

export interface InstalacaoDetalhe {
  id: string;
  nome_cliente: string;
  data_conclusao: string | null;
  metragem?: number | null;
  origem: 'pedido' | 'neo';
}

export interface RankingEquipe {
  equipe_id: string;
  equipe_nome: string;
  equipe_cor: string | null;
  quantidade_instalacoes: number;
  metragem_total: number;
  ultima_instalacao: string | null;
  instalacoes_detalhes: InstalacaoDetalhe[];
}

export function useRankingEquipesInstalacao() {
  const [ranking, setRanking] = useState<RankingEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  const fetchRanking = async () => {
    try {
      setLoading(true);

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

      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes_instalacao')
        .select('id, nome, cor, ativa')
        .eq('ativa', true);

      if (equipesError) throw equipesError;

      const equipesMap = new Map(
        (equipesData || []).map(eq => [eq.id, eq])
      );

      let queryInstalacoes = supabase
        .from('instalacoes')
        .select(`
          id,
          responsavel_instalacao_id,
          metragem_quadrada,
          instalacao_concluida_em,
          nome_cliente
        `)
        .eq('instalacao_concluida', true)
        .eq('tipo_instalacao', 'elisa')
        .not('responsavel_instalacao_id', 'is', null);

      let queryNeoInstalacoes = supabase
        .from('neo_instalacoes')
        .select(`
          id,
          equipe_id,
          concluida_em,
          nome_cliente
        `)
        .eq('concluida', true)
        .eq('tipo_responsavel', 'equipe_interna')
        .not('equipe_id', 'is', null);

      if (dataInicio && dataFim) {
        queryInstalacoes = queryInstalacoes
          .gte('instalacao_concluida_em', dataInicio.toISOString())
          .lte('instalacao_concluida_em', dataFim.toISOString());
        
        queryNeoInstalacoes = queryNeoInstalacoes
          .gte('concluida_em', dataInicio.toISOString())
          .lte('concluida_em', dataFim.toISOString());
      }

      const [instalacoesResult, neoInstalacoesResult] = await Promise.all([
        queryInstalacoes,
        queryNeoInstalacoes
      ]);

      if (instalacoesResult.error) throw instalacoesResult.error;
      if (neoInstalacoesResult.error) throw neoInstalacoesResult.error;

      const instalacoesData = instalacoesResult.data || [];
      const neoInstalacoesData = neoInstalacoesResult.data || [];

      const agrupamento = new Map<string, RankingEquipe>();

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
            ultima_instalacao: null,
            instalacoes_detalhes: []
          });
        }

        const item = agrupamento.get(equipeId)!;
        item.quantidade_instalacoes += 1;
        item.metragem_total += instalacao.metragem_quadrada || 0;
        item.instalacoes_detalhes.push({
          id: instalacao.id,
          nome_cliente: instalacao.nome_cliente,
          data_conclusao: instalacao.instalacao_concluida_em,
          metragem: instalacao.metragem_quadrada,
          origem: 'pedido'
        });
        
        if (!item.ultima_instalacao || 
            (instalacao.instalacao_concluida_em && instalacao.instalacao_concluida_em > item.ultima_instalacao)) {
          item.ultima_instalacao = instalacao.instalacao_concluida_em;
        }
      });

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
            ultima_instalacao: null,
            instalacoes_detalhes: []
          });
        }

        const item = agrupamento.get(equipeId)!;
        item.quantidade_instalacoes += 1;
        item.instalacoes_detalhes.push({
          id: neo.id,
          nome_cliente: neo.nome_cliente,
          data_conclusao: neo.concluida_em,
          metragem: null,
          origem: 'neo'
        });
        
        if (!item.ultima_instalacao || 
            (neo.concluida_em && neo.concluida_em > item.ultima_instalacao)) {
          item.ultima_instalacao = neo.concluida_em;
        }
      });

      const rankingArray = Array.from(agrupamento.values())
        .sort((a, b) => b.quantidade_instalacoes - a.quantidade_instalacoes);

      // Sort details by date desc within each team
      rankingArray.forEach(eq => {
        eq.instalacoes_detalhes.sort((a, b) => {
          if (!a.data_conclusao) return 1;
          if (!b.data_conclusao) return -1;
          return b.data_conclusao.localeCompare(a.data_conclusao);
        });
      });

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
