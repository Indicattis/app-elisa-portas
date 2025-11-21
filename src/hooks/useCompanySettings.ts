import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "@/types/company";
import { toast } from "sonner";

export function useCompanySettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as CompanySettings;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id!)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis'] });
      toast.success('Configurações da empresa atualizadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar configurações: ' + error.message);
    }
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}
