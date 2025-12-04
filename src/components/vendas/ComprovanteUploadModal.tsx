import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, ExternalLink, Trash2, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ComprovanteUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: {
    id: string;
    cliente_nome: string;
    comprovante_url?: string | null;
    comprovante_nome?: string | null;
  } | null;
}

export function ComprovanteUploadModal({ open, onOpenChange, venda }: ComprovanteUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Selecione um arquivo PNG, JPG ou PDF.",
          variant: "destructive"
        });
        return;
      }

      // Validar tamanho (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      
      // Criar preview para imagens
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !venda) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${venda.id}/${Date.now()}.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('comprovantes-pagamento')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('comprovantes-pagamento')
        .getPublicUrl(fileName);

      // Atualizar venda com URL do comprovante
      const { error: updateError } = await supabase
        .from('vendas')
        .update({
          comprovante_url: urlData.publicUrl,
          comprovante_nome: file.name
        })
        .eq('id', venda.id);

      if (updateError) throw updateError;

      toast({
        title: "Comprovante anexado",
        description: "O comprovante foi salvo com sucesso."
      });

      // Invalidar cache para recarregar vendas
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      
      // Resetar estados e fechar modal
      setFile(null);
      setPreview(null);
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao anexar",
        description: error.message || "Ocorreu um erro ao salvar o comprovante.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveComprovante = async () => {
    if (!venda) return;

    setUploading(true);
    try {
      // Remover referência do comprovante na venda
      const { error } = await supabase
        .from('vendas')
        .update({
          comprovante_url: null,
          comprovante_nome: null
        })
        .eq('id', venda.id);

      if (error) throw error;

      toast({
        title: "Comprovante removido",
        description: "O comprovante foi removido da venda."
      });

      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao remover:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover o comprovante.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  const isImage = venda?.comprovante_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Comprovante de Pagamento
          </DialogTitle>
          <DialogDescription>
            {venda?.cliente_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comprovante existente */}
          {venda?.comprovante_url && (
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Comprovante atual</Label>
              
              {isImage ? (
                <img 
                  src={venda.comprovante_url} 
                  alt="Comprovante" 
                  className="w-full max-h-48 object-contain rounded border"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{venda.comprovante_nome || 'Documento PDF'}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(venda.comprovante_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRemoveComprovante}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload de novo comprovante */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {venda?.comprovante_url ? 'Substituir comprovante' : 'Anexar comprovante'}
            </Label>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPG, PDF (máx. 10MB)
            </p>

            {/* Preview do arquivo selecionado */}
            {file && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate flex-1">{file.name}</span>
                </div>
                
                {preview && (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full max-h-32 object-contain rounded"
                  />
                )}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? (
                "Enviando..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
