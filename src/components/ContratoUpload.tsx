import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { useContratoUpload } from "@/hooks/useContratoUpload";

interface ContratoUploadProps {
  contratoUrl?: string | null;
  contratoNome?: string | null;
  onContratoChange: (url: string, nome: string, tamanho: number) => void;
  onContratoRemove?: () => void;
}

export function ContratoUpload({ 
  contratoUrl, 
  contratoNome, 
  onContratoChange,
  onContratoRemove 
}: ContratoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { mutateAsync: uploadContrato } = useContratoUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 20MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadContrato(file);
      onContratoChange(result.url, result.fileName, result.size);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {contratoUrl ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{contratoNome || 'Contrato'}</p>
            <a 
              href={contratoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Visualizar contrato
            </a>
          </div>
          {onContratoRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onContratoRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="contrato-upload"
          />
          <label htmlFor="contrato-upload" className="cursor-pointer">
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Anexar Contrato (PDF)'}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}
