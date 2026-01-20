import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, Eye, Loader2, Image } from "lucide-react";
import { useFichaVisitaUpload } from "@/hooks/useFichaVisitaUpload";
import { toast } from "sonner";

interface FichaVisitaUploadProps {
  fichaUrl?: string | null;
  fichaNome?: string | null;
  onFichaChange: (url: string, nome: string) => void;
  onFichaRemove?: () => void;
  disabled?: boolean;
}

export function FichaVisitaUpload({
  fichaUrl,
  fichaNome,
  onFichaChange,
  onFichaRemove,
  disabled = false,
}: FichaVisitaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useFichaVisitaUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, PNG, JPG ou WEBP.');
      return;
    }

    // Validar tamanho (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo permitido: 20MB.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(file);
      onFichaChange(result.url, result.fileName);
      toast.success('Ficha de visita técnica anexada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (onFichaRemove) {
      onFichaRemove();
    }
  };

  const isImage = fichaNome?.match(/\.(png|jpg|jpeg|webp)$/i);

  if (fichaUrl && fichaNome) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          {isImage ? (
            <Image className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-primary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fichaNome}</p>
            <p className="text-xs text-muted-foreground">
              {isImage ? 'Imagem' : 'Documento PDF'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={fichaUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isImage && (
          <div className="relative w-full max-w-xs mx-auto">
            <a href={fichaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={fichaUrl}
                alt="Preview da ficha de visita"
                className="rounded-lg border shadow-sm w-full h-auto object-contain max-h-48"
              />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Anexar Ficha de Visita Técnica
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Formatos aceitos: PDF, PNG, JPG, WEBP (máx. 20MB)
      </p>
    </div>
  );
}
