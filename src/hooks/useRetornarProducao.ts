import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao';
}

interface RetornarProducaoParams {
  pedidoId: string;
  ordemQualidadeId: string;
  motivo: string;
  ordensReativar: string[]; // tipos: 'soldagem', 'perfiladeira', 'separacao'
}

export function useRetornarProducao(pedidoId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar ordens de produção do pedido
  const { data: ordensProducao, isLoading } = useQuery({
    queryKey: ['ordens-producao-pedido', pedidoId],
    queryFn: async () => {
      if (!pedidoId) return [];

      const ordens: OrdemProducao[] = [];

      // Buscar ordens de soldagem
      const { data: soldagem } = await supabase
        .from('ordens_soldagem')
        .select('id, numero_ordem, status')
        .eq('pedido_id', pedidoId)
        .maybeSingle();
      
      if (soldagem) {
        ordens.push({ ...soldagem, tipo: 'soldagem' });
      }

      // Buscar ordens de perfiladeira
      const { data: perfiladeira } = await supabase
        .from('ordens_perfiladeira')
        .select('id, numero_ordem, status')
        .eq('pedido_id', pedidoId)
        .maybeSingle();
      
      if (perfiladeira) {
        ordens.push({ ...perfiladeira, tipo: 'perfiladeira' });
      }

      // Buscar ordens de separação
      const { data: separacao } = await supabase
        .from('ordens_separacao')
        .select('id, numero_ordem, status')
        .eq('pedido_id', pedidoId)
        .maybeSingle();
      
      if (separacao) {
        ordens.push({ ...separacao, tipo: 'separacao' });
      }

      return ordens;
    },
    enabled: !!pedidoId,
  });

  // Mutation para executar o retorno
  const retornarParaProducao = useMutation({
    mutationFn: async ({ pedidoId, ordemQualidadeId, motivo, ordensReativar }: RetornarProducaoParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('retornar_pedido_para_producao', {
        p_pedido_id: pedidoId,
        p_ordem_qualidade_id: ordemQualidadeId,
        p_motivo: motivo,
        p_ordens_reativar: ordensReativar,
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pedido retornado para produção com sucesso');
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'qualidade'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'soldagem'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'perfiladeira'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'separacao'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-producao'] });
    },
    onError: (error: any) => {
      console.error('Erro ao retornar para produção:', error);
      toast.error(error.message || 'Erro ao retornar para produção');
    },
  });

  return {
    ordensProducao: ordensProducao || [],
    isLoading,
    retornarParaProducao,
  };
}
