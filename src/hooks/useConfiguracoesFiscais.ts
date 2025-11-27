import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfiguracoesFiscais {
  id: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario?: string;
  codigo_municipio_ibge?: string;
  serie_nfe?: number;
  serie_nfse?: number;
  aliquota_iss_padrao?: number;
  codigo_servico_padrao?: string;
  descricao_servico_padrao?: string;
  cnae?: string;
  ambiente?: string;
  email_copia?: string;
  created_at: string;
  updated_at: string;
}

export function useConfiguracoesFiscais() {
  const queryClient = useQueryClient();

  const { data: configuracoes, isLoading } = useQuery({
    queryKey: ['configuracoes-fiscais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_fiscais')
        .select('*')
        .single();
      
      if (error) {
        // Se não existir configuração, retornar objeto vazio
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data as ConfiguracoesFiscais;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (config: Partial<ConfiguracoesFiscais>) => {
      const { data, error } = await supabase
        .from('configuracoes_fiscais')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id!)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-fiscais'] });
      toast.success('Configurações fiscais atualizadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar configurações: ' + error.message);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (config: Partial<ConfiguracoesFiscais>) => {
      const { data, error } = await supabase
        .from('configuracoes_fiscais')
        .insert([config])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-fiscais'] });
      toast.success('Configurações fiscais criadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar configurações: ' + error.message);
    }
  });

  return {
    configuracoes,
    isLoading,
    updateConfiguracoes: updateMutation.mutate,
    createConfiguracoes: createMutation.mutate,
    isUpdating: updateMutation.isPending,
    isCreating: createMutation.isPending
  };
}
