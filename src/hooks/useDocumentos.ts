import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Documento {
  id: string;
  titulo: string;
  descricao?: string;
  arquivo_url: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  categoria: 'manual' | 'procedimento' | 'formulario' | 'contrato' | 'politica' | 'outros';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useDocumentos() {
  return useQuery({
    queryKey: ['documentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Documento[];
    },
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documento: Omit<Documento, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('documentos')
        .insert(documento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast({
        title: "Sucesso",
        description: "Documento criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar documento: " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-publicos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('documentos-publicos')
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        fileName: file.name,
        size: file.size,
      };
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload: " + error.message,
        variant: "destructive",
      });
    },
  });
}