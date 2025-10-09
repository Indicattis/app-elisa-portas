import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UseCanEditVendaParams {
  atendenteId?: string;
  vendaId?: string;
}

export function useCanEditVenda(params?: UseCanEditVendaParams | string) {
  const { user, isAdmin } = useAuth();
  const [isFaturada, setIsFaturada] = useState(false);
  const [loading, setLoading] = useState(true);

  // Suporte para chamadas antigas (compatibilidade)
  const vendaAtendenteId = typeof params === 'string' ? params : params?.atendenteId;
  const vendaId = typeof params === 'string' ? undefined : params?.vendaId;

  useEffect(() => {
    async function checkFaturamento() {
      if (!vendaId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar a venda com seus produtos
        const { data: venda, error } = await supabase
          .from('vendas')
          .select('*, portas_vendas(lucro_item, quantidade), frete_aprovado')
          .eq('id', vendaId)
          .single();

        if (error) throw error;

        const portas = venda.portas_vendas || [];
        
        if (portas.length === 0) {
          setIsFaturada(false);
          setLoading(false);
          return;
        }

        // Verifica se todos os produtos têm lucro definido
        const todosProdutosFaturados = portas.every((p: any) => (p.lucro_item || 0) > 0);
        
        // Verifica se o frete foi aprovado
        const freteAprovado = venda.frete_aprovado === true;
        
        // Venda está faturada se todos os produtos têm lucro E o frete foi aprovado
        setIsFaturada(todosProdutosFaturados && freteAprovado);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar faturamento:', error);
        setIsFaturada(false);
        setLoading(false);
      }
    }

    checkFaturamento();
  }, [vendaId]);

  if (!user || !vendaAtendenteId) {
    return { canEdit: false, loading, isFaturada };
  }

  // Atendentes não podem editar vendas faturadas
  const canEdit = isAdmin || (vendaAtendenteId === user.id && !isFaturada);

  return { canEdit, loading, isFaturada };
}
