import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UseCanEditVendaParams {
  atendenteId?: string;
  vendaId?: string;
}

export type BlockReason = 'faturada' | 'com_pedido' | 'ambos' | 'nao_proprietario' | null;

interface CanEditResult {
  canEdit: boolean;
  loading: boolean;
  isFaturada: boolean;
  hasPedido: boolean;
  pedidoId: string | null;
  blockReason: BlockReason;
}

export function useCanEditVenda(params?: UseCanEditVendaParams | string): CanEditResult {
  const { user, isAdmin } = useAuth();
  const [isFaturada, setIsFaturada] = useState(false);
  const [hasPedido, setHasPedido] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Suporte para chamadas antigas (compatibilidade)
  const vendaAtendenteId = typeof params === 'string' ? params : params?.atendenteId;
  const vendaId = typeof params === 'string' ? undefined : params?.vendaId;

  useEffect(() => {
    async function checkEditPermissions() {
      if (!vendaId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar a venda com seus produtos
        const { data: venda, error } = await supabase
          .from('vendas')
          .select('*, produtos_vendas(lucro_item, quantidade, faturamento), frete_aprovado, atendente_id')
          .eq('id', vendaId)
          .single();

        if (error) throw error;

        // Verificar se é o proprietário da venda
        const owner = venda.atendente_id === user?.id;
        setIsOwner(owner);

        const produtos = venda.produtos_vendas || [];
        
        // Verifica se todos os produtos têm lucro definido e estão faturados
        const todosProdutosFaturados = Array.isArray(produtos) && 
          produtos.length > 0 && 
          produtos.every((p: any) => p.faturamento === true);
        
        // Verifica se o frete foi aprovado
        const freteAprovado = venda.frete_aprovado === true;
        
        // Venda está faturada se todos os produtos estão faturados E o frete foi aprovado
        const faturada = todosProdutosFaturados && freteAprovado;
        setIsFaturada(faturada);

        // Verificar se existe pedido vinculado
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos_producao')
          .select('id')
          .eq('venda_id', vendaId)
          .maybeSingle();

        if (pedidoError && pedidoError.code !== 'PGRST116') throw pedidoError;

        const temPedido = !!pedido;
        setHasPedido(temPedido);
        setPedidoId(pedido?.id || null);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar permissões de edição:', error);
        setIsFaturada(false);
        setHasPedido(false);
        setPedidoId(null);
        setLoading(false);
      }
    }

    checkEditPermissions();
  }, [vendaId, user?.id]);

  // Determinar o motivo do bloqueio
  let blockReason: BlockReason = null;
  
  if (!isOwner && !isAdmin) {
    blockReason = 'nao_proprietario';
  } else if (isFaturada && hasPedido) {
    blockReason = 'ambos';
  } else if (isFaturada) {
    blockReason = 'faturada';
  } else if (hasPedido) {
    blockReason = 'com_pedido';
  }

  // Pode editar se: (é dono OU admin) E não está faturada E não tem pedido
  const canEdit = (isOwner || isAdmin) && !isFaturada && !hasPedido;

  return { 
    canEdit, 
    loading, 
    isFaturada, 
    hasPedido, 
    pedidoId,
    blockReason 
  };
}
