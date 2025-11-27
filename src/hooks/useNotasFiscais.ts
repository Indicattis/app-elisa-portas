import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotaFiscal {
  id: string;
  tipo: 'entrada' | 'saida';
  numero: string;
  serie: string;
  chave_acesso?: string;
  valor_total: number;
  data_emissao: string;
  data_vencimento?: string;
  cnpj_cpf: string;
  razao_social: string;
  status: 'emitida' | 'pendente' | 'cancelada';
  venda_id?: string;
  xml_url?: string;
  pdf_url?: string;
  xml_nome_arquivo?: string;
  pdf_nome_arquivo?: string;
  observacoes?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface NotaFiscalFormData {
  tipo: 'entrada' | 'saida';
  numero: string;
  serie: string;
  chave_acesso?: string;
  valor_total: number;
  data_emissao: string;
  data_vencimento?: string;
  cnpj_cpf: string;
  razao_social: string;
  status: 'emitida' | 'pendente' | 'cancelada';
  venda_id?: string;
  observacoes?: string;
  xml_url?: string;
  pdf_url?: string;
  xml_nome_arquivo?: string;
  pdf_nome_arquivo?: string;
}

interface UseNotasFiscaisParams {
  tipo?: 'entrada' | 'saida';
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const useNotasFiscais = (params?: UseNotasFiscaisParams) => {
  const queryClient = useQueryClient();

  const { data: notasFiscais, isLoading } = useQuery({
    queryKey: ['notas-fiscais', params],
    queryFn: async () => {
      let query = supabase
        .from('notas_fiscais')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (params?.tipo) {
        query = query.eq('tipo', params.tipo);
      }
      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.dataInicio) {
        query = query.gte('data_emissao', params.dataInicio);
      }
      if (params?.dataFim) {
        query = query.lte('data_emissao', params.dataFim);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as NotaFiscal[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: NotaFiscalFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notas_fiscais')
        .insert([{
          ...data,
          created_by: user?.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('Nota fiscal cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar nota fiscal: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NotaFiscalFormData> }) => {
      const { error } = await supabase
        .from('notas_fiscais')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('Nota fiscal atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar nota fiscal: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notas_fiscais')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('Nota fiscal excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir nota fiscal: ' + error.message);
    }
  });

  const uploadArquivo = async (file: File, notaId: string, tipo: 'xml' | 'pdf') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${notaId}_${tipo}.${fileExt}`;
      const filePath = `notas-fiscais/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const updateData = tipo === 'xml' 
        ? { xml_url: publicUrl, xml_nome_arquivo: file.name }
        : { pdf_url: publicUrl, pdf_nome_arquivo: file.name };

      await updateMutation.mutateAsync({ id: notaId, data: updateData });
      
      toast.success(`Arquivo ${tipo.toUpperCase()} enviado com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    }
  };

  return {
    notasFiscais,
    isLoading,
    createNotaFiscal: createMutation.mutate,
    updateNotaFiscal: updateMutation.mutate,
    deleteNotaFiscal: deleteMutation.mutate,
    uploadArquivo,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
