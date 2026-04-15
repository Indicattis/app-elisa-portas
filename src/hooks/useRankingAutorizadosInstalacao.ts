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

export interface RankingAutorizado {
  autorizado_id: string;
  autorizado_nome: string;
  quantidade_instalacoes: number;
  metragem_total: number;
  ultima_instalacao: string | null;
  instalacoes_detalhes: InstalacaoDetalhe[];
}

export function useRankingAutorizadosInstalacao() {
  const [ranking, setRanking] = useState<RankingAutorizado[]>([]);
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

      // Fetch active autorizados
      const { data: autorizadosData, error: autorizadosError } = await supabase
        .from('autorizados')
        .select('id, nome')
        .eq('ativo', true);

      if (autorizadosError) throw autorizadosError;

      const autorizadosMap = new Map(
        (autorizadosData || []).map(a => [a.id, a])
      );

      // Fetch instalacoes (pedidos) done by autorizados
      let queryInstalacoes = supabase
        .from('instalacoes')
        .select('id, responsavel_instalacao_id, metragem_quadrada, instalacao_concluida_em, nome_cliente')
        .eq('instalacao_concluida', true)
        .not('responsavel_instalacao_id', 'is', null);

      // Fetch neo_instalacoes done by autorizados
      let queryNeo = supabase
        .from('neo_instalacoes')
        .select('id, autorizado_id, concluida_em, nome_cliente')
        .eq('concluida', true)
        .eq('tipo_responsavel', 'autorizado')
        .not('autorizado_id', 'is', null);

      if (dataInicio && dataFim) {
        queryInstalacoes = queryInstalacoes
          .gte('instalacao_concluida_em', dataInicio.toISOString())
          .lte('instalacao_concluida_em', dataFim.toISOString());
        queryNeo = queryNeo
          .gte('concluida_em', dataInicio.toISOString())
          .lte('concluida_em', dataFim.toISOString());
      }

      const [instResult, neoResult] = await Promise.all([queryInstalacoes, queryNeo]);

      if (instResult.error) throw instResult.error;
      if (neoResult.error) throw neoResult.error;

      const agrupamento = new Map<string, RankingAutorizado>();

      const addToGroup = (autId: string, autNome: string, detalhe: InstalacaoDetalhe, metragem: number) => {
        if (!agrupamento.has(autId)) {
          agrupamento.set(autId, {
            autorizado_id: autId,
            autorizado_nome: autNome,
            quantidade_instalacoes: 0,
            metragem_total: 0,
            ultima_instalacao: null,
            instalacoes_detalhes: []
          });
        }
        const item = agrupamento.get(autId)!;
        item.quantidade_instalacoes += 1;
        item.metragem_total += metragem;
        item.instalacoes_detalhes.push(detalhe);
        if (!item.ultima_instalacao || (detalhe.data_conclusao && detalhe.data_conclusao > item.ultima_instalacao)) {
          item.ultima_instalacao = detalhe.data_conclusao;
        }
      };

      // Process instalacoes - only those whose responsavel is an autorizado
      (instResult.data || []).forEach((inst: any) => {
        const aut = autorizadosMap.get(inst.responsavel_instalacao_id);
        if (!aut) return;
        addToGroup(aut.id, aut.nome, {
          id: inst.id,
          nome_cliente: inst.nome_cliente,
          data_conclusao: inst.instalacao_concluida_em,
          metragem: inst.metragem_quadrada,
          origem: 'pedido'
        }, inst.metragem_quadrada || 0);
      });

      // Process neo_instalacoes
      (neoResult.data || []).forEach((neo: any) => {
        const aut = autorizadosMap.get(neo.autorizado_id);
        const nome = aut?.nome || neo.autorizado_nome || 'Autorizado';
        const id = neo.autorizado_id;
        addToGroup(id, nome, {
          id: neo.id,
          nome_cliente: neo.nome_cliente,
          data_conclusao: neo.concluida_em,
          metragem: null,
          origem: 'neo'
        }, 0);
      });

      const rankingArray = Array.from(agrupamento.values())
        .sort((a, b) => b.quantidade_instalacoes - a.quantidade_instalacoes);

      rankingArray.forEach(a => {
        a.instalacoes_detalhes.sort((x, y) => {
          if (!x.data_conclusao) return 1;
          if (!y.data_conclusao) return -1;
          return y.data_conclusao.localeCompare(x.data_conclusao);
        });
      });

      setRanking(rankingArray);
    } catch (error) {
      console.error('Erro ao buscar ranking autorizados:', error);
      toast.error('Erro ao carregar ranking dos autorizados');
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

  return { ranking, loading, periodo, setPeriodo, maxInstalacoes, refetch: fetchRanking };
}
