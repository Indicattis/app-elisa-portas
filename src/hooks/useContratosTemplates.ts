import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContratoTemplate } from "@/types/contrato";

export function useContratosTemplates() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['contratos-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_templates')
        .select('*')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContratoTemplate[];
    }
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<ContratoTemplate>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contratos_templates')
        .insert([{
          nome: template.nome!,
          descricao: template.descricao,
          conteudo: template.conteudo!,
          ativo: template.ativo ?? true,
          ordem: template.ordem ?? 0,
          created_by: userData.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-templates'] });
      toast.success('Template criado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContratoTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('contratos_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-templates'] });
      toast.success('Template atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('contratos_templates')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-templates'] });
      toast.success('Status do template atualizado');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do template');
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contratos_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-templates'] });
      toast.success('Template excluído com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    isCreating: createTemplate.isPending,
    updateTemplate: updateTemplate.mutate,
    isUpdating: updateTemplate.isPending,
    toggleTemplate: toggleTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isDeleting: deleteTemplate.isPending
  };
}
