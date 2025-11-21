import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useContratosTemplates } from "@/hooks/useContratosTemplates";
import { useContratosVendas } from "@/hooks/useContratosVendas";
import { useVendas } from "@/hooks/useVendas";
import { Upload, FileCheck } from "lucide-react";
import { toast } from "sonner";

interface UploadContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaIdInicial?: string;
}

export function UploadContratoModal({ open, onOpenChange, vendaIdInicial }: UploadContratoModalProps) {
  const [vendaId, setVendaId] = useState(vendaIdInicial || '');
  const [templateId, setTemplateId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { templates } = useContratosTemplates();
  const { uploadContrato, isUploading } = useContratosVendas();
  const { vendas } = useVendas();

  const templatesAtivos = templates?.filter(t => t.ativo) || [];

  // Sincronizar vendaId quando vendaIdInicial mudar ou modal abrir
  useEffect(() => {
    if (open && vendaIdInicial) {
      setVendaId(vendaIdInicial);
    }
  }, [open, vendaIdInicial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são permitidos');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo: 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendaId || !file) {
      toast.error('Selecione uma venda e faça upload do arquivo');
      return;
    }

    uploadContrato(
      {
        file,
        vendaId,
        templateId: templateId || undefined,
        observacoes: observacoes || undefined
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setVendaId('');
          setTemplateId('');
          setObservacoes('');
          setFile(null);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Contrato Assinado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venda-upload">Selecione a Venda *</Label>
            <Select value={vendaId} onValueChange={setVendaId} disabled={!!vendaIdInicial}>
              <SelectTrigger id="venda-upload">
                <SelectValue placeholder="Selecione uma venda" />
              </SelectTrigger>
              <SelectContent>
                {vendas?.map((venda) => (
                  <SelectItem key={venda.id} value={venda.id}>
                    {venda.id.slice(0, 8)} - {venda.cliente_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-upload">Template Usado (opcional)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template-upload">
                <SelectValue placeholder="Selecione o template usado" />
              </SelectTrigger>
              <SelectContent>
                {templatesAtivos.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Arquivo do Contrato (PDF) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex-1"
                required
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileCheck className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas PDF, máximo 10MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes-upload">Observações</Label>
            <Textarea
              id="observacoes-upload"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre este contrato..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                'Enviando...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Vincular Contrato
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
