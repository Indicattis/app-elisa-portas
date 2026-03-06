import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gerarProximoNumero, formatarNumeroPedido } from '@/utils/numberingService';
import { ProdutoVenda } from '@/hooks/useVendas';

export function useCriarPedidoCorrecaoCompleto() {
  const [isLoading, setIsLoading] = useState(false);

  const criarPedidoCorrecao = async (
    pedidoOrigemId: string,
    produtos: ProdutoVenda[],
    observacoes?: string
  ): Promise<string | null> => {
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

      // Inserir produtos vinculados à venda do pedido original
      if (produtos.length > 0 && pedidoOrigem.venda_id) {
        const produtosParaInserir = produtos.map(produto => ({
          venda_id: pedidoOrigem.venda_id,
          tipo_produto: produto.tipo_produto,
          tamanho: produto.tamanho || '',
          cor_id: produto.cor_id || null,
          acessorio_id: produto.acessorio_id || null,
          adicional_id: produto.adicional_id || null,
          valor_produto: produto.valor_produto,
          valor_pintura: produto.valor_pintura,
          valor_instalacao: produto.valor_instalacao,
          valor_frete: produto.valor_frete,
          tipo_desconto: produto.tipo_desconto,
          desconto_percentual: produto.desconto_percentual,
          desconto_valor: produto.desconto_valor,
          quantidade: produto.quantidade,
          descricao: produto.descricao || `Correção - ${produto.tipo_produto}`,
          valor_credito: produto.valor_credito || 0,
          percentual_credito: produto.percentual_credito || 0,
        }));

        const { error: produtosError } = await supabase
          .from('produtos_vendas')
          .insert(produtosParaInserir);

        if (produtosError) {
          console.error('Erro ao inserir produtos da correção:', produtosError);
          // Não bloquear - pedido já foi criado
        }
      }

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
