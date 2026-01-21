import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePedidoCreation } from './usePedidoCreation';
import { useState } from 'react';

export interface ConfiguracaoPedidoTeste {
  nomeCliente: string;
  temPintura: boolean;
  corPinturaId?: string;
  corPinturaNome?: string;
  tipoEntrega: 'entrega' | 'instalacao';
  tipoFabricacao: 'interno' | 'terceirizado';
  tipoProduto: 'porta_enrolar' | 'porta_social' | 'manutencao';
  largura: number;
  altura: number;
}

export const usePedidoTeste = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { createPedidoFromVenda } = usePedidoCreation();

  const createPedidoTeste = async (config: ConfiguracaoPedidoTeste): Promise<string | null> => {
    setIsCreating(true);
    
    try {
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar admin_users id do usuário atual
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (adminError) throw new Error('Usuário admin não encontrado');

      // Criar venda fictícia com prefixo [TESTE]
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_nome: config.nomeCliente,
          cliente_telefone: '(00) 00000-0000',
          tipo_entrega: config.tipoEntrega,
          data_venda: new Date().toISOString(),
          atendente_id: adminUser.id,
          forma_pagamento: 'teste',
          publico_alvo: 'teste',
          estado: 'MG',
          cidade: 'Teste',
          cep: '00000-000',
          bairro: 'Teste',
          endereco: 'Rua Teste, 123',
          valor_venda: 1000,
          observacoes_venda: `[PEDIDO TESTE] Pintura: ${config.temPintura ? 'Sim' : 'Não'} | Entrega: ${config.tipoEntrega} | Fabricação: ${config.tipoFabricacao}`
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Criar produto da venda
      const tamanho = `${config.largura}x${config.altura}`;
      const { error: produtoError } = await supabase
        .from('produtos_vendas')
        .insert({
          venda_id: venda.id,
          tipo_produto: config.tipoProduto,
          tipo_fabricacao: config.tipoFabricacao,
          valor_pintura: config.temPintura ? 100 : 0,
          cor_id: config.corPinturaId || null,
          largura: config.largura,
          altura: config.altura,
          quantidade: 1,
          valor_produto: 1000,
          valor_frete: 0,
          valor_instalacao: config.tipoEntrega === 'instalacao' ? 200 : 0,
          valor_total: 1000,
          valor_total_sem_frete: 1000,
          desconto_percentual: 0,
          desconto_valor: 0,
          tipo_desconto: 'valor',
          tamanho: tamanho
        });

      if (produtoError) throw produtoError;

      // Usar o hook existente para criar o pedido
      const pedidoId = await createPedidoFromVenda(venda.id);

      if (pedidoId) {
        toast.success(`Pedido de teste criado com sucesso!`);
      }
      
      return pedidoId;
    } catch (error) {
      console.error('Erro ao criar pedido de teste:', error);
      toast.error('Erro ao criar pedido de teste');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createPedidoTeste, isCreating };
};
