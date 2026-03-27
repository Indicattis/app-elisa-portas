import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useAjustePontuacaoInstalacao() {
  const [pendentes, setPendentes] = useState<InstalacaoPendente[]>([]);
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPendentes = async () => {
    try {
      setLoading(true);

      // Buscar instalações vinculadas a pedidos finalizados sem equipe ou não concluídas
      const { data, error } = await supabase
        .from('instalacoes')
        .select(`
          id,
          nome_cliente,
          responsavel_instalacao_id,
          instalacao_concluida,
          pedido_id,
          pedidos_producao!inner (
            id,
            numero_pedido,
            etapa_atual,
            created_at
          )
        `)
        .eq('pedidos_producao.etapa_atual', 'finalizado')
        .or('responsavel_instalacao_id.is.null,instalacao_concluida.eq.false');

      if (error) throw error;

      const items: InstalacaoPendente[] = (data || []).map((row: any) => ({
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
  }, []);

  return {
    pendentes,
    equipes,
    loading,
    saving,
    atribuirEquipe,
    refetch: fetchPendentes,
  };
}
