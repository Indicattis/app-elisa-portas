import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CorrecaoLinha {
  id: string;
  correcao_id: string;
  descricao: string;
  quantidade: number;
  created_at: string;
}

export interface CorrecaoDetalhes {
  id: string;
  pedido_id: string | null;
  nome_cliente: string;
  observacoes: string | null;
  custo_correcao: number;
  setor_causador: string | null;
  justificativa: string | null;
  etapa_causadora: string | null;
}

export function useCorrecaoDetalhes(pedidoId: string | null) {
  const queryClient = useQueryClient();

  const { data: correcao, isLoading: isLoadingCorrecao } = useQuery({
    queryKey: ['correcao-detalhes', pedidoId],
    queryFn: async () => {
      if (!pedidoId) return null;
      const { data, error } = await supabase
        .from('correcoes')
        .select('id, pedido_id, nome_cliente, observacoes, custo_correcao, setor_causador, justificativa, etapa_causadora')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CorrecaoDetalhes | null;
    },
    enabled: !!pedidoId,
  });

  const { data: linhas = [], isLoading: isLoadingLinhas } = useQuery({
    queryKey: ['correcao-linhas', correcao?.id],
    queryFn: async () => {
      if (!correcao?.id) return [];
      const { data, error } = await supabase
        .from('correcao_linhas')
        .select('*')
        .eq('correcao_id', correcao.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CorrecaoLinha[];
    },
    enabled: !!correcao?.id,
  });

  const salvarDetalhes = useMutation({
    mutationFn: async (params: {
      custo_correcao: number;
      setor_causador: string | null;
      justificativa: string | null;
      etapa_causadora: string | null;
    }) => {
      if (!correcao?.id) throw new Error('Correção não encontrada');
      const { error } = await supabase
        .from('correcoes')
        .update({
          custo_correcao: params.custo_correcao,
          setor_causador: params.setor_causador,
          justificativa: params.justificativa,
          etapa_causadora: params.etapa_causadora,
        })
        .eq('id', correcao.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correcao-detalhes', pedidoId] });
      toast.success('Detalhes da correção salvos');
    },
    onError: () => toast.error('Erro ao salvar detalhes'),
  });

  const adicionarLinha = useMutation({
    mutationFn: async (params: { descricao: string; quantidade: number }) => {
      if (!correcao?.id) throw new Error('Correção não encontrada');
      const { error } = await supabase
        .from('correcao_linhas')
        .insert({
          correcao_id: correcao.id,
          descricao: params.descricao,
          quantidade: params.quantidade,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correcao-linhas', correcao?.id] });
    },
    onError: () => toast.error('Erro ao adicionar linha'),
  });

  const removerLinha = useMutation({
    mutationFn: async (linhaId: string) => {
      const { error } = await supabase
        .from('correcao_linhas')
        .delete()
        .eq('id', linhaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correcao-linhas', correcao?.id] });
    },
    onError: () => toast.error('Erro ao remover linha'),
  });

  return {
    correcao,
    linhas,
    isLoading: isLoadingCorrecao || isLoadingLinhas,
    salvarDetalhes,
    adicionarLinha,
    removerLinha,
  };
}
