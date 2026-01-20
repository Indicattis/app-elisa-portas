import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFichaVisitaUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fichas-visita-tecnica')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('fichas-visita-tecnica')
        .getPublicUrl(fileName);
      
      return {
        url: data.publicUrl,
        fileName: file.name,
        size: file.size
      };
    },
    onError: (error) => {
      console.error('Erro ao fazer upload da ficha de visita:', error);
      toast.error('Erro ao fazer upload da ficha de visita técnica');
    }
  });
}
