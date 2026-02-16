import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gerarProximoNumero, formatarNumeroPedido } from '@/utils/numberingService';

export function useCriarPedidoCorrecao() {
  const [isLoading, setIsLoading] = useState(false);

  const criarPedidoCorrecao = async (pedidoOrigemId: string, observacoes?: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      // Buscar dados do pedido original
      const { data: pedidoOrigem, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('*')
        .eq('id', pedidoOrigemId)
        .single();

      if (pedidoError || !pedidoOrigem) {
        throw new Error('Pedido original não encontrado');
      }

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número do pedido
      const numeroSequencial = await gerarProximoNumero('pedido');
      const numeroPedido = formatarNumeroPedido(numeroSequencial);

      // Gerar número mensal
      const { data: numeroMesData } = await supabase.rpc('gerar_proximo_numero_mes');
      const numeroMes = numeroMesData?.[0]?.numero || 1;
      const mesVigencia = numeroMesData?.[0]?.mes;

      // Criar pedido de correção
      const { data: novoPedido, error: insertError } = await supabase
        .from('pedidos_producao')
        .insert({
          venda_id: pedidoOrigem.venda_id,
          numero_pedido: numeroPedido,
          numero_mes: numeroMes,
          mes_vigencia: mesVigencia,
          cliente_nome: pedidoOrigem.cliente_nome,
          cliente_telefone: pedidoOrigem.cliente_telefone,
          cliente_email: pedidoOrigem.cliente_email,
          etapa_atual: 'aberto',
          status: 'pendente',
          created_by: user.id,
          prioridade_etapa: 0,
          is_correcao: true,
          pedido_origem_id: pedidoOrigemId,
          observacoes: observacoes || null,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Criar etapa inicial
      const { error: etapaError } = await supabase
        .from('pedidos_etapas')
        .insert({
          pedido_id: novoPedido.id,
          etapa: 'aberto',
          checkboxes: [],
        });

      if (etapaError) throw etapaError;

      // Registrar movimentação
      await supabase.from('pedidos_movimentacoes').insert({
        pedido_id: novoPedido.id,
        user_id: user.id,
        etapa_destino: 'aberto',
        teor: 'criacao',
        descricao: `Pedido de correção criado a partir do pedido ${pedidoOrigem.numero_pedido} - ${pedidoOrigem.cliente_nome}${observacoes ? ` | Motivo: ${observacoes}` : ''}`,
      });

      toast.success(`Pedido de correção ${numeroPedido} criado com sucesso!`);
      return novoPedido.id;
    } catch (error) {
      console.error('Erro ao criar pedido de correção:', error);
      toast.error('Erro ao criar pedido de correção');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { criarPedidoCorrecao, isLoading };
}
