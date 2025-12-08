import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, isBefore } from 'date-fns';

export interface Veiculo {
  id: string;
  nome: string;
  modelo: string;
  placa?: string | null;
  ano: number;
  km_atual: number;
  data_troca_oleo: string | null;
  km_proxima_troca_oleo: number | null;
  data_proxima_troca_oleo: string | null;
  status: 'pronto' | 'atencao' | 'critico' | 'mecanico' | 'em_uso';
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  ultima_conferencia_data?: string | null;
}

export interface VeiculoFormData {
  nome: string;
  modelo: string;
  placa?: string;
  ano: number;
  km_atual: number;
  data_troca_oleo?: string;
  km_proxima_troca_oleo?: number;
  data_proxima_troca_oleo?: string;
  status: 'pronto' | 'atencao' | 'critico' | 'mecanico' | 'em_uso';
  foto_url?: string;
}

export function precisaConferenciaSemanal(veiculo: Veiculo): boolean {
  if (!veiculo.ultima_conferencia_data) return true;
  
  const hoje = new Date();
  const ultimaConferencia = new Date(veiculo.ultima_conferencia_data);
  const inicioSemana = startOfWeek(hoje);
  
  return isBefore(ultimaConferencia, inicioSemana);
}

export function useVeiculos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: veiculos, isLoading } = useQuery({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('veiculos')
        .select(`
          *,
          conferencias:veiculos_conferencias(created_at)
        `)
        .eq('ativo', true)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      // Adicionar data da última conferência e garantir tipo correto do status
      return data.map(veiculo => ({
        ...veiculo,
        status: veiculo.status as 'pronto' | 'atencao' | 'critico' | 'mecanico' | 'em_uso',
        ultima_conferencia_data: veiculo.conferencias?.[0]?.created_at || null
      })) as Veiculo[];
    }
  });

  const createVeiculoMutation = useMutation({
    mutationFn: async (data: VeiculoFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: veiculo, error } = await supabase
        .from('veiculos')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return veiculo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso',
        description: 'Veículo cadastrado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar veículo',
        description: error.message,
      });
    }
  });

  const updateVeiculoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VeiculoFormData> }) => {
      const { error } = await supabase
        .from('veiculos')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso',
        description: 'Veículo atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: error.message,
      });
    }
  });

  const deleteVeiculoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('veiculos')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso',
        description: 'Veículo removido com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover veículo',
        description: error.message,
      });
    }
  });

  const uploadFotoMutation = useMutation({
    mutationFn: async ({ file, veiculo_id }: { file: File; veiculo_id?: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${veiculo_id || Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('veiculos-fotos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('veiculos-fotos')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer upload da foto',
        description: error.message,
      });
    }
  });

  return {
    veiculos,
    isLoading,
    createVeiculo: createVeiculoMutation.mutateAsync,
    updateVeiculo: updateVeiculoMutation.mutateAsync,
    deleteVeiculo: deleteVeiculoMutation.mutateAsync,
    uploadFoto: uploadFotoMutation.mutateAsync,
    isCreating: createVeiculoMutation.isPending,
    isUpdating: updateVeiculoMutation.isPending,
    isDeleting: deleteVeiculoMutation.isPending,
    isUploading: uploadFotoMutation.isPending,
  };
}
