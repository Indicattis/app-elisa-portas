import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmpresaEmissora, EmpresaEmissoraFormData } from "@/types/empresaEmissora";

export function useEmpresasEmissoras() {
  const queryClient = useQueryClient();

  const { data: empresas, isLoading } = useQuery({
    queryKey: ['empresas-emissoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .select('*')
        .order('padrao', { ascending: false })
        .order('nome');
      
      if (error) throw error;
      return data as EmpresaEmissora[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (empresa: EmpresaEmissoraFormData) => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .insert([empresa])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-emissoras'] });
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar empresa: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...empresa }: Partial<EmpresaEmissora>) => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .update(empresa)
        .eq('id', id!)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-emissoras'] });
      toast.success('Empresa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar empresa: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresas_emissoras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-emissoras'] });
      toast.success('Empresa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir empresa: ' + error.message);
    }
  });

  const setPadraoMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, remove padrao from all companies
      await supabase
        .from('empresas_emissoras')
        .update({ padrao: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Then set the selected company as padrao
      const { error } = await supabase
        .from('empresas_emissoras')
        .update({ padrao: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-emissoras'] });
      toast.success('Empresa padrão definida!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao definir empresa padrão: ' + error.message);
    }
  });

  return {
    empresas,
    isLoading,
    createEmpresa: createMutation.mutate,
    updateEmpresa: updateMutation.mutate,
    deleteEmpresa: deleteMutation.mutate,
    setPadrao: setPadraoMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingPadrao: setPadraoMutation.isPending
  };
}
