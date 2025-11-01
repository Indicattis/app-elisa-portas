import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gerarProximoNumero, formatarNumeroPedido } from '@/utils/numberingService';

export const usePedidoCreation = () => {
  const createPedidoFromVenda = async (vendaId: string): Promise<string | null> => {
    try {
      // Buscar dados da venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', vendaId)
        .single();

      if (vendaError) throw vendaError;
      if (!venda) throw new Error('Venda não encontrada');

      // Verificar se já existe um pedido para esta venda
      const { data: pedidoExistente } = await supabase
        .from('pedidos_producao')
        .select('id')
        .eq('venda_id', vendaId)
        .maybeSingle();

      if (pedidoExistente) {
        toast.error('Já existe um pedido para esta venda');
        return pedidoExistente.id;
      }

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número do pedido
      const numeroSequencial = await gerarProximoNumero('pedido');
      const numeroPedido = formatarNumeroPedido(numeroSequencial);

      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .insert({
          venda_id: vendaId,
          numero_pedido: numeroPedido,
          etapa_atual: 'aberto',
          status: 'pendente',
          created_by: user.id,
          prioridade_etapa: Date.now(),
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar etapa inicial
      const { error: etapaError } = await supabase
        .from('pedidos_etapas')
        .insert({
          pedido_id: pedido.id,
          etapa: 'aberto',
          checkboxes: [],
        });

      if (etapaError) throw etapaError;

      toast.success(`Pedido ${numeroPedido} criado com sucesso!`);
      return pedido.id;
    } catch (error) {
      console.error('Error creating pedido:', error);
      toast.error('Erro ao criar pedido de produção');
      return null;
    }
  };

  return { createPedidoFromVenda };
};
