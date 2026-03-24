import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Transportadora {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportadoraInput {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  ativo?: boolean;
}

export function useTransportadoras() {
  const queryClient = useQueryClient();

  const { data: transportadoras, isLoading } = useQuery({
    queryKey: ['transportadoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data as Transportadora[];
    }
  });

  const createTransportadora = useMutation({
    mutationFn: async (input: TransportadoraInput) => {
      const { data, error } = await supabase
        .from('transportadoras')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      toast.success('Transportadora cadastrada!');
    },
    onError: () => toast.error('Erro ao cadastrar transportadora')
  });

  const updateTransportadora = useMutation({
    mutationFn: async ({ id, ...input }: TransportadoraInput & { id: string }) => {
      const { data, error } = await supabase
        .from('transportadoras')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      toast.success('Transportadora atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar transportadora')
  });

  const deleteTransportadora = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transportadoras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      toast.success('Transportadora excluída!');
    },
    onError: () => toast.error('Erro ao excluir transportadora')
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('transportadoras').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status')
  });

  return { transportadoras, isLoading, createTransportadora, updateTransportadora, deleteTransportadora, toggleAtivo };
}
