import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useContratoUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contratos-autorizados')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('contratos-autorizados')
        .getPublicUrl(fileName);
      
      return {
        url: data.publicUrl,
        fileName: file.name,
        size: file.size
      };
    },
    onError: (error) => {
      console.error('Erro ao fazer upload do contrato:', error);
      toast.error('Erro ao fazer upload do contrato');
    }
  });
}
