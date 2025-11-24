import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrdemCarregamento, OrdemCarregamentoFormData } from '@/types/ordemCarregamento';
import { toast } from 'sonner';

export const useOrdensCarregamento = () => {
  const [ordens, setOrdens] = useState<OrdemCarregamento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ordens_carregamento')
        .select(`
          *,
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual,
            status
          ),
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_venda
          )
        `)
        .eq('carregamento_concluido', false)
        .order('data_carregamento', { ascending: true });

      if (error) throw error;

      setOrdens(data || []);
    } catch (error) {
      console.error('Erro ao buscar ordens de carregamento:', error);
      toast.error('Erro ao buscar ordens de carregamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdens();

    // Real-time subscription
    const channel = supabase
      .channel('ordens_carregamento_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento',
        },
        () => {
          fetchOrdens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createOrdem = async (data: OrdemCarregamentoFormData) => {
    try {
      const { error } = await supabase
        .from('ordens_carregamento')
        .insert({
          pedido_id: data.pedido_id,
          venda_id: data.venda_id,
          nome_cliente: data.nome_cliente,
          data_carregamento: data.data_carregamento,
          hora_carregamento: data.hora_carregamento,
          hora: data.hora_carregamento, // Manter compatibilidade
          tipo_carregamento: data.tipo_carregamento,
          responsavel_carregamento_id: data.responsavel_carregamento_id,
          responsavel_carregamento_nome: data.responsavel_carregamento_nome,
          status: 'pronta_fabrica',
        });

      if (error) throw error;

      toast.success('Ordem de carregamento criada com sucesso!');
      await fetchOrdens();
      return true;
    } catch (error) {
      console.error('Erro ao criar ordem de carregamento:', error);
      toast.error('Erro ao criar ordem de carregamento');
      return false;
    }
  };

  const concluirOrdem = async (ordemId: string) => {
    try {
      const { error } = await supabase.rpc('concluir_ordem_carregamento', {
        p_ordem_id: ordemId,
      });

      if (error) throw error;

      toast.success('Ordem de carregamento concluída! Pedido avançado para Finalizado.');
      await fetchOrdens();
      return true;
    } catch (error: any) {
      console.error('Erro ao concluir ordem de carregamento:', error);
      toast.error(error.message || 'Erro ao concluir ordem de carregamento');
      return false;
    }
  };

  return {
    ordens,
    loading,
    fetchOrdens,
    createOrdem,
    concluirOrdem,
  };
};
