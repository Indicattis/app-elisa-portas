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
  // Campos API Focus NFe
  ref_externa?: string;
  api_id?: string;
  protocolo_autorizacao?: string;
  status_sefaz?: string;
  motivo_rejeicao?: string;
  data_autorizacao?: string;
  danfe_url?: string;
  xml_autorizado_url?: string;
  email_enviado?: boolean;
  ambiente?: string;
  codigo_servico?: string;
  descricao_servico?: string;
  aliquota_iss?: number;
  valor_iss?: number;
  tomador_endereco?: string;
  tomador_numero?: string;
  tomador_bairro?: string;
  tomador_cidade?: string;
  tomador_uf?: string;
  tomador_cep?: string;
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

  const emitirNfseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('emitir-nfse', {
        body: data
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('NFS-e enviada para processamento!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao emitir NFS-e: ' + error.message);
    }
  });

  const emitirNfeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('emitir-nfe', {
        body: data
      });
      
      // Verificar erro do Supabase
      if (error) throw error;
      
      // Verificar se a resposta indica erro da API Focus
      if (result && !result.success && result.errorDetails) {
        const details = result.errorDetails;
        let errorMessage = details.mensagem;
        
        // Adicionar erros específicos se existirem
        if (details.erros && details.erros.length > 0) {
          errorMessage += '\n\nDetalhes:\n• ' + details.erros.join('\n• ');
        }
        
        // Adicionar sugestão de correção
        if (details.correcao) {
          errorMessage += '\n\n💡 ' + details.correcao;
        }
        
        throw new Error(errorMessage);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('NF-e enviada para processamento!');
    },
    onError: (error: Error) => {
      // Mostrar erro com formatação melhorada
      toast.error('Erro ao emitir NF-e', {
        description: error.message,
        duration: 10000, // 10 segundos para dar tempo de ler
      });
    }
  });

  const consultarNotaMutation = useMutation({
    mutationFn: async (notaFiscalId: string) => {
      const { data: result, error } = await supabase.functions.invoke('consultar-nota', {
        body: { notaFiscalId }
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('Status da nota atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao consultar nota: ' + error.message);
    }
  });

  const cancelarNotaMutation = useMutation({
    mutationFn: async ({ notaFiscalId, motivo }: { notaFiscalId: string; motivo: string }) => {
      const { data: result, error } = await supabase.functions.invoke('cancelar-nota', {
        body: { notaFiscalId, motivo }
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      toast.success('Nota fiscal cancelada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar nota: ' + error.message);
    }
  });

  return {
    notasFiscais,
    isLoading,
    createNotaFiscal: createMutation.mutate,
    updateNotaFiscal: updateMutation.mutate,
    deleteNotaFiscal: deleteMutation.mutate,
    uploadArquivo,
    emitirNfse: emitirNfseMutation.mutate,
    emitirNfe: emitirNfeMutation.mutate,
    consultarNota: consultarNotaMutation.mutate,
    cancelarNota: cancelarNotaMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEmitindoNfse: emitirNfseMutation.isPending,
    isEmitindoNfe: emitirNfeMutation.isPending,
    isConsultando: consultarNotaMutation.isPending,
    isCancelando: cancelarNotaMutation.isPending
  };
};
