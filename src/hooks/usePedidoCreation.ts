import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gerarProximoNumero, formatarNumeroPedido } from '@/utils/numberingService';

export const usePedidoCreation = () => {
  const checkExistingPedido = async (vendaId: string): Promise<string | null> => {
    try {
      const { data: pedidoExistente } = await supabase
        .from('pedidos_producao')
        .select('id, numero_pedido')
        .eq('venda_id', vendaId)
        .maybeSingle();

      return pedidoExistente?.id || null;
    } catch (error) {
      console.error('Error checking existing pedido:', error);
      return null;
    }
  };

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
          venda_id: vendaId as any,
          numero_pedido: numeroPedido,
          cliente_nome: venda.cliente_nome,
          cliente_telefone: venda.cliente_telefone,
          cliente_email: venda.cliente_email,
          etapa_atual: 'aberto',
          status: 'pendente',
          created_by: user.id,
          prioridade_etapa: 0,
        } as any)
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

      // Registrar movimentação de criação no histórico
      await supabase.from('pedidos_movimentacoes').insert({
        pedido_id: pedido.id,
        user_id: user.id,
        etapa_destino: 'aberto',
        teor: 'criacao',
        descricao: `Pedido criado a partir da venda ${venda.cliente_nome}`
      });

      toast.success(`Pedido ${numeroPedido} criado com sucesso!`);
      return pedido.id;
    } catch (error) {
      console.error('Error creating pedido:', error);
      toast.error('Erro ao criar pedido de produção');
      return null;
    }
  };

  return { createPedidoFromVenda, checkExistingPedido };
};
