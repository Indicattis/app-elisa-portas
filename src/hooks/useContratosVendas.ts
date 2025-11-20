import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContratoVenda } from "@/types/contrato";

export function useContratosVendas(vendaId?: string) {
  const queryClient = useQueryClient();

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['contratos-vendas', vendaId],
    queryFn: async () => {
      let query = supabase
        .from('contratos_vendas')
        .select(`
          *,
          template:contratos_templates(*)
        `)
        .order('created_at', { ascending: false });
      
      if (vendaId) {
        query = query.eq('venda_id', vendaId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ContratoVenda[];
    },
    enabled: !!vendaId
  });

  const uploadContrato = useMutation({
    mutationFn: async ({ 
      file, 
      vendaId, 
      templateId, 
      observacoes 
    }: { 
      file: File; 
      vendaId: string; 
      templateId?: string; 
      observacoes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('contratos-vendas')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('contratos-vendas')
        .getPublicUrl(fileName);
      
      // Criar registro no banco
      const { data, error } = await supabase
        .from('contratos_vendas')
        .insert({
          venda_id: vendaId,
          template_id: templateId,
          arquivo_url: urlData.publicUrl,
          nome_arquivo: file.name,
          tamanho_arquivo: file.size,
          observacoes,
          uploaded_by: userData.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-vendas'] });
      toast.success('Contrato vinculado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao fazer upload do contrato:', error);
      toast.error('Erro ao fazer upload do contrato');
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContratoVenda['status'] }) => {
      const { error } = await supabase
        .from('contratos_vendas')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-vendas'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  });

  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      // Buscar o contrato para deletar o arquivo do storage
      const { data: contrato } = await supabase
        .from('contratos_vendas')
        .select('arquivo_url')
        .eq('id', id)
        .single();
      
      if (contrato?.arquivo_url) {
        const fileName = contrato.arquivo_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('contratos-vendas')
            .remove([fileName]);
        }
      }
      
      // Deletar registro do banco
      const { error } = await supabase
        .from('contratos_vendas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-vendas'] });
      toast.success('Contrato excluído com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir contrato:', error);
      toast.error('Erro ao excluir contrato');
    }
  });

  return {
    contratos,
    isLoading,
    uploadContrato: uploadContrato.mutate,
    isUploading: uploadContrato.isPending,
    updateStatus: updateStatus.mutate,
    deleteContrato: deleteContrato.mutate,
    isDeleting: deleteContrato.isPending
  };
}
