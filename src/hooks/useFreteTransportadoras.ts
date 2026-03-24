import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FreteTransportadora {
  id: string;
  transportadora_id: string;
  estado: string;
  valor_porta_p: number;
  valor_porta_g: number;
  valor_porta_gg: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreteTransportadoraInput {
  transportadora_id: string;
  estado: string;
  valor_porta_p: number;
  valor_porta_g: number;
  valor_porta_gg: number;
  ativo?: boolean;
}

export function useFreteTransportadoras(transportadoraId?: string) {
  const queryClient = useQueryClient();

  const { data: fretes, isLoading } = useQuery({
    queryKey: ['frete_transportadoras', transportadoraId],
    queryFn: async () => {
      let query = supabase.from('frete_transportadoras').select('*').order('estado', { ascending: true });
      if (transportadoraId) query = query.eq('transportadora_id', transportadoraId);
      const { data, error } = await query;
      if (error) throw error;
      return data as FreteTransportadora[];
    }
  });

  const createFrete = useMutation({
    mutationFn: async (input: FreteTransportadoraInput) => {
      const { data, error } = await supabase.from('frete_transportadoras').insert(input).select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe valor para este estado/transportadora');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frete_transportadoras'] });
      toast.success('Valor cadastrado!');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao cadastrar')
  });

  const updateFrete = useMutation({
    mutationFn: async ({ id, ...input }: FreteTransportadoraInput & { id: string }) => {
      const { data, error } = await supabase.from('frete_transportadoras').update(input).eq('id', id).select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe valor para este estado/transportadora');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frete_transportadoras'] });
      toast.success('Valor atualizado!');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar')
  });

  const deleteFrete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('frete_transportadoras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frete_transportadoras'] });
      toast.success('Valor excluído!');
    },
    onError: () => toast.error('Erro ao excluir')
  });

  return { fretes, isLoading, createFrete, updateFrete, deleteFrete };
}
