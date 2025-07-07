
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarUpdate: (url: string | null) => void;
}

export function AvatarUpload({ userId, currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload da imagem
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      const avatarUrl = data.publicUrl;

      // Atualizar na base de dados
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ foto_perfil_url: avatarUrl })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(avatarUrl);
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer upload da foto",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      // Remover da base de dados
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ foto_perfil_url: null })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(null);
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover foto",
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
        <AvatarImage src={currentAvatarUrl || undefined} alt={userName} />
        <AvatarFallback className="text-lg">
          {getInitials(userName)}
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
              {uploading ? "Enviando..." : "Alterar Foto"}
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </label>
          </Button>
          
          {currentAvatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeAvatar}
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
