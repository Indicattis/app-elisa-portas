import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

export type PeriodoFiltroAjuste = 'mes' | 'ano' | 'todos';

export interface InstalacaoPendente {
  instalacao_id: string;
  pedido_numero: string;
  nome_cliente: string;
  data_pedido: string | null;
}

export interface EquipeOption {
  id: string;
  nome: string;
}

export function useAjustePontuacaoInstalacao(periodo: PeriodoFiltroAjuste = 'mes') {
  const [pendentes, setPendentes] = useState<InstalacaoPendente[]>([]);
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPendentes = async () => {
    try {
      setLoading(true);

      // Calcular datas do período
      const now = new Date();
      let dataInicio: string | null = null;
      let dataFim: string | null = null;

      if (periodo === 'mes') {
        dataInicio = startOfMonth(now).toISOString();
        dataFim = endOfMonth(now).toISOString();
      } else if (periodo === 'ano') {
        dataInicio = startOfYear(now).toISOString();
        dataFim = endOfYear(now).toISOString();
      }

      // Buscar instalações vinculadas a pedidos finalizados sem equipe ou não concluídas
      let query = supabase
        .from('instalacoes')
        .select(`
          id,
          nome_cliente,
          responsavel_instalacao_id,
          instalacao_concluida,
          tipo_instalacao,
          pedido_id,
          pedidos_producao!inner (
            id,
            numero_pedido,
            etapa_atual,
            created_at,
            venda_id,
            vendas!inner (
              tipo_entrega
            )
          )
        `)
        .eq('pedidos_producao.etapa_atual', 'finalizado')
        .in('pedidos_producao.vendas.tipo_entrega', ['instalacao', 'manutencao'])
        .or('tipo_instalacao.is.null,tipo_instalacao.eq.elisa')
        .or('responsavel_instalacao_id.is.null,instalacao_concluida.eq.false');

      if (dataInicio) {
        query = query.gte('pedidos_producao.created_at', dataInicio);
      }
      if (dataFim) {
        query = query.lte('pedidos_producao.created_at', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items: InstalacaoPendente[] = (data || [])
        .filter((row: any) => row.pedidos_producao?.etapa_atual === 'finalizado')
        .map((row: any) => ({
          instalacao_id: row.id,
          pedido_numero: row.pedidos_producao?.numero_pedido || '—',
          nome_cliente: row.nome_cliente,
          data_pedido: row.pedidos_producao?.created_at || null,
        }));

      // Ordenar por número do pedido
      items.sort((a, b) => a.pedido_numero.localeCompare(b.pedido_numero));
      setPendentes(items);
    } catch (error) {
      console.error('Erro ao buscar instalações pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes_instalacao')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setEquipes(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
    }
  };

  const atribuirEquipe = async (instalacaoId: string, equipeId: string, equipeNome: string) => {
    try {
      setSaving(instalacaoId);

      const { error } = await supabase
        .from('instalacoes')
        .update({
          responsavel_instalacao_id: equipeId,
          responsavel_instalacao_nome: equipeNome,
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
        })
        .eq('id', instalacaoId);

      if (error) throw error;

      toast.success('Equipe atribuída com sucesso');
      setPendentes(prev => prev.filter(p => p.instalacao_id !== instalacaoId));
    } catch (error) {
      console.error('Erro ao atribuir equipe:', error);
      toast.error('Erro ao atribuir equipe');
    } finally {
      setSaving(null);
    }
  };

  useEffect(() => {
    fetchPendentes();
    fetchEquipes();
  }, [periodo]);

  return {
    pendentes,
    equipes,
    loading,
    saving,
    atribuirEquipe,
    refetch: fetchPendentes,
  };
}
