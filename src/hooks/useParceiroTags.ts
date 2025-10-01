import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ParceiroTag {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParceiroTagAssignment {
  id: string;
  parceiro_id: string;
  tag_id: string;
  created_at: string;
}

export const useParceiroTags = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as tags
  const tagsQuery = useQuery({
    queryKey: ['parceiro-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parceiro_tags')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data as ParceiroTag[];
    }
  });

  // Criar nova tag
  const createTagMutation = useMutation({
    mutationFn: async (newTag: { nome: string; cor: string }) => {
      const { data, error } = await supabase
        .from('parceiro_tags')
        .insert([newTag])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiro-tags'] });
      toast({
        title: "Tag criada",
        description: "A tag foi criada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar tag",
        description: "Não foi possível criar a tag.",
        variant: "destructive"
      });
    }
  });

  // Atualizar tag
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ParceiroTag> & { id: string }) => {
      const { data, error } = await supabase
        .from('parceiro_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiro-tags'] });
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso."
      });
    }
  });

  // Deletar tag
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parceiro_tags')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiro-tags'] });
      toast({
        title: "Tag removida",
        description: "A tag foi removida com sucesso."
      });
    }
  });

  return {
    tags: tagsQuery.data ?? [],
    isLoading: tagsQuery.isLoading,
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate
  };
};

export const useParceiroTagAssignments = (parceiroId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar tags atribuídas a um parceiro
  const assignmentsQuery = useQuery({
    queryKey: ['parceiro-tag-assignments', parceiroId],
    queryFn: async () => {
      if (!parceiroId) return [];
      
      const { data, error } = await supabase
        .from('parceiro_tag_assignments')
        .select(`
          *,
          parceiro_tags:tag_id (*)
        `)
        .eq('parceiro_id', parceiroId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!parceiroId
  });

  // Atribuir tag a parceiro
  const assignTagMutation = useMutation({
    mutationFn: async ({ parceiroId, tagId }: { parceiroId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('parceiro_tag_assignments')
        .insert([{ parceiro_id: parceiroId, tag_id: tagId }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiro-tag-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
    }
  });

  // Remover atribuição de tag
  const unassignTagMutation = useMutation({
    mutationFn: async ({ parceiroId, tagId }: { parceiroId: string; tagId: string }) => {
      const { error } = await supabase
        .from('parceiro_tag_assignments')
        .delete()
        .eq('parceiro_id', parceiroId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiro-tag-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
    }
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    assignTag: assignTagMutation.mutate,
    unassignTag: unassignTagMutation.mutate
  };
};
