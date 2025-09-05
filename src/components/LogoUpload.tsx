import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

interface LogoUploadProps {
  autorizadoId: string;
  currentLogoUrl?: string | null;
  autorizadoName: string;
  onLogoUpdate: (url: string | null) => void;
}

export function LogoUpload({ autorizadoId, currentLogoUrl, autorizadoName, onLogoUpdate }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validação do tipo de arquivo
      if (!file.type.startsWith("image/")) {
        throw new Error("Por favor, selecione apenas arquivos de imagem.");
      }

      // Validação do tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("A imagem deve ter no máximo 5MB.");
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${autorizadoId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('autorizados-logos')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '31536000' // 1 ano
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('autorizados-logos')
        .getPublicUrl(filePath);

      // Atualizar na base de dados com a URL do Storage
      const { error: updateError } = await supabase
        .from('autorizados')
        .update({ logo_url: publicUrl })
        .eq('id', autorizadoId);

      if (updateError) {
        throw updateError;
      }

      onLogoUpdate(publicUrl);
      
      toast({
        title: "Sucesso",
        description: "Logo atualizado com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error?.message || "Erro ao fazer upload do logo",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      setUploading(true);

      // Se existe URL atual, tentar remover do storage
      if (currentLogoUrl && currentLogoUrl.includes('autorizados-logos')) {
        const filePath = currentLogoUrl.split('/autorizados-logos/')[1];
        if (filePath) {
          await supabase.storage
            .from('autorizados-logos')
            .remove([`logos/${filePath}`]);
        }
      }

      // Remover da base de dados
      const { error: updateError } = await supabase
        .from('autorizados')
        .update({ logo_url: null })
        .eq('id', autorizadoId);

      if (updateError) {
        throw updateError;
      }

      onLogoUpdate(null);
      
      toast({
        title: "Sucesso",
        description: "Logo removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover logo",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="w-16 h-16">
        <AvatarImage 
          src={currentLogoUrl || undefined} 
          alt={autorizadoName} 
        />
        <AvatarFallback className="text-lg">
          {getInitials(autorizadoName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <label className="cursor-pointer">
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Enviando..." : "Alterar Logo"}
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadLogo}
                disabled={uploading}
              />
            </label>
          </Button>
          
          {currentLogoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeLogo}
              disabled={uploading}
            >
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou GIF. Máx. 5MB.
        </p>
      </div>
    </div>
  );
}