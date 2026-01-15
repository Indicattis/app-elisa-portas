import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CriterioNegociacao {
  id: string;
  autorizado_id: string;
  criterio: string;
  valor: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useCriteriosNegociacao(autorizadoId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['criterios-negociacao', autorizadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('criterios_negociacao_autorizados')
        .select('*')
        .eq('autorizado_id', autorizadoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as CriterioNegociacao[];
    },
    enabled: !!autorizadoId,
  });

  const addCriterio = useMutation({
    mutationFn: async (data: { criterio: string; valor: string }) => {
      const { data: criterios } = await supabase
        .from('criterios_negociacao_autorizados')
        .select('ordem')
        .eq('autorizado_id', autorizadoId)
        .order('ordem', { ascending: false })
        .limit(1);

      const nextOrdem = (criterios?.[0]?.ordem ?? -1) + 1;

      const { error } = await supabase
        .from('criterios_negociacao_autorizados')
        .insert({
          autorizado_id: autorizadoId,
          criterio: data.criterio,
          valor: data.valor,
          ordem: nextOrdem,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criterios-negociacao', autorizadoId] });
      toast({ title: 'Critério adicionado com sucesso' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao adicionar critério' });
    },
  });

  const updateCriterio = useMutation({
    mutationFn: async (data: { id: string; criterio: string; valor: string }) => {
      const { error } = await supabase
        .from('criterios_negociacao_autorizados')
        .update({ criterio: data.criterio, valor: data.valor })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criterios-negociacao', autorizadoId] });
      toast({ title: 'Critério atualizado com sucesso' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar critério' });
    },
  });

  const deleteCriterio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('criterios_negociacao_autorizados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criterios-negociacao', autorizadoId] });
      toast({ title: 'Critério removido com sucesso' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao remover critério' });
    },
  });

  return {
    criterios: query.data ?? [],
    isLoading: query.isLoading,
    addCriterio,
    updateCriterio,
    deleteCriterio,
  };
}

export function useObservacoesNegociacao(autorizadoId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['observacoes-negociacao', autorizadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autorizados')
        .select('observacoes_negociacao')
        .eq('id', autorizadoId)
        .single();

      if (error) throw error;
      return data?.observacoes_negociacao ?? '';
    },
    enabled: !!autorizadoId,
  });

  const updateObservacoes = useMutation({
    mutationFn: async (observacoes: string) => {
      const { error } = await supabase
        .from('autorizados')
        .update({ observacoes_negociacao: observacoes })
        .eq('id', autorizadoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes-negociacao', autorizadoId] });
      toast({ title: 'Observações salvas com sucesso' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao salvar observações' });
    },
  });

  return {
    observacoes: query.data ?? '',
    isLoading: query.isLoading,
    updateObservacoes,
  };
}
