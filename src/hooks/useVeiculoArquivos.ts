import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VeiculoArquivo {
  id: string;
  veiculo_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useVeiculoArquivos(veiculoId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: arquivos, isLoading } = useQuery({
    queryKey: ['veiculo-arquivos', veiculoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('veiculos_arquivos')
        .select('*')
        .eq('veiculo_id', veiculoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VeiculoArquivo[];
    },
    enabled: !!veiculoId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, veiculoId }: { file: File; veiculoId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const sanitized = file.name.replace(`.${fileExt}`, '').replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `veiculos/${veiculoId}/${Date.now()}-${sanitized}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-publicos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos-publicos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('veiculos_arquivos')
        .insert({
          veiculo_id: veiculoId,
          nome: file.name,
          url: publicUrl,
          tipo: file.type,
          tamanho: file.size,
          uploaded_by: user?.id,
        });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculo-arquivos', veiculoId] });
      toast({ title: 'Sucesso', description: 'Arquivo enviado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao enviar arquivo', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (arquivo: VeiculoArquivo) => {
      // Extract storage path from URL
      const urlParts = arquivo.url.split('/documentos-publicos/');
      if (urlParts[1]) {
        const storagePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from('documentos-publicos').remove([storagePath]);
      }
      const { error } = await supabase.from('veiculos_arquivos').delete().eq('id', arquivo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculo-arquivos', veiculoId] });
      toast({ title: 'Sucesso', description: 'Arquivo removido com sucesso' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao remover arquivo', description: error.message });
    },
  });

  return {
    arquivos,
    isLoading,
    uploadArquivo: uploadMutation.mutateAsync,
    deleteArquivo: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
