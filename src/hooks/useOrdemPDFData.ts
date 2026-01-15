import { supabase } from "@/integrations/supabase/client";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

interface OrdemPDFData {
  ordem: {
    id: string;
    numero_ordem: string;
    tipo_ordem: TipoOrdem;
    status: string;
    observacoes?: string;
    created_at: string;
  };
  pedido: {
    numero_pedido: string;
    cliente_nome: string;
    data_entrega?: string;
    observacoes?: string;
    venda_id?: string;
  };
  venda?: {
    forma_pagamento?: string;
    valor_venda?: number;
  } | null;
  produtos: Array<{
    nome_produto: string;
    quantidade: number;
    tamanho?: string;
  }>;
  linhas: Array<{
    item: string;
    quantidade: number;
    tamanho?: string;
    concluida: boolean;
  }>;
}

export const useOrdemPDFData = () => {
  const buscarDadosOrdem = async (
    ordemId: string,
    tipoOrdem: TipoOrdem
  ): Promise<OrdemPDFData> => {
    // 1. Buscar dados da ordem baseado no tipo
    let ordem: any;
    let pedidoId: string;
    
    switch (tipoOrdem) {
      case 'soldagem': {
        const { data, error } = await supabase
          .from('ordens_soldagem')
          .select('*')
          .eq('id', ordemId)
          .single();
        if (error) throw error;
        ordem = data;
        pedidoId = data?.pedido_id;
        break;
      }
      case 'perfiladeira': {
        const { data, error } = await supabase
          .from('ordens_perfiladeira')
          .select('*')
          .eq('id', ordemId)
          .single();
        if (error) throw error;
        ordem = data;
        pedidoId = data?.pedido_id;
        break;
      }
      case 'separacao': {
        const { data, error } = await supabase
          .from('ordens_separacao')
          .select('*')
          .eq('id', ordemId)
          .single();
        if (error) throw error;
        ordem = data;
        pedidoId = data?.pedido_id;
        break;
      }
      case 'qualidade': {
        const { data, error } = await supabase
          .from('ordens_qualidade')
          .select('*')
          .eq('id', ordemId)
          .single();
        if (error) throw error;
        ordem = data;
        pedidoId = data?.pedido_id;
        break;
      }
      case 'pintura': {
        const { data, error } = await supabase
          .from('ordens_pintura')
          .select('*')
          .eq('id', ordemId)
          .single();
        if (error) throw error;
        ordem = data;
        pedidoId = data?.pedido_id;
        break;
      }
      default:
        throw new Error(`Tipo de ordem inválido: ${tipoOrdem}`);
    }
    
    if (!ordem) throw new Error('Ordem não encontrada');
    
    // 2. Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_producao')
      .select('numero_pedido, cliente_nome, data_entrega, observacoes, venda_id')
      .eq('id', pedidoId)
      .single();
    
    if (pedidoError) throw pedidoError;
    if (!pedido) throw new Error('Pedido não encontrado');
    
    // 3. Buscar dados da venda (pode não existir)
    let venda = null;
    if (pedido.venda_id) {
      const { data: vendaData } = await supabase
        .from('vendas')
        .select('forma_pagamento, valor_venda')
        .eq('id', pedido.venda_id)
        .maybeSingle();
      
      venda = vendaData;
    }
    
    // 4. Buscar produtos do pedido (todas as linhas)
    const { data: produtos, error: produtosError } = await supabase
      .from('pedido_linhas')
      .select('nome_produto, quantidade, tamanho')
      .eq('pedido_id', pedidoId)
      .order('ordem', { ascending: true });
    
    if (produtosError) throw produtosError;
    
    // 5. Buscar linhas específicas desta ordem com nome atualizado do estoque
    const { data: linhasRaw, error: linhasError } = await supabase
      .from('linhas_ordens')
      .select(`
        item, quantidade, tamanho, concluida, estoque_id,
        estoque:estoque_id (nome_produto)
      `)
      .eq('ordem_id', ordemId)
      .eq('tipo_ordem', tipoOrdem)
      .order('created_at', { ascending: true });
    
    if (linhasError) throw linhasError;
    
    // Processar linhas para usar nome atualizado do estoque
    const linhas = linhasRaw?.map((linha: any) => ({
      ...linha,
      item: linha.estoque?.nome_produto || linha.item
    })) || [];
    
    return {
      ordem: {
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        tipo_ordem: tipoOrdem,
        status: ordem.status,
        observacoes: ordem.observacoes,
        created_at: ordem.created_at,
      },
      pedido: {
        numero_pedido: pedido.numero_pedido,
        cliente_nome: pedido.cliente_nome,
        data_entrega: pedido.data_entrega,
        observacoes: pedido.observacoes,
        venda_id: pedido.venda_id,
      },
      venda,
      produtos: produtos || [],
      linhas: linhas || [],
    };
  };
  
  return { buscarDadosOrdem };
};
