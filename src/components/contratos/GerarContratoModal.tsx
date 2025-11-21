import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContratosTemplates } from "@/hooks/useContratosTemplates";
import { useVendas } from "@/hooks/useVendas";
import { useContratoVariaveis, substituirVariaveis } from "@/hooks/useContratoVariaveis";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { generateContratoPDF } from "@/utils/contratoPDFGenerator";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface GerarContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaIdInicial?: string;
}

export function GerarContratoModal({ open, onOpenChange, vendaIdInicial }: GerarContratoModalProps) {
  const [vendaId, setVendaId] = useState(vendaIdInicial || '');
  const [templateId, setTemplateId] = useState('');
  
  const { templates } = useContratosTemplates();
  const { vendas } = useVendas();
  const { data: variaveis, isLoading: isLoadingVariaveis } = useContratoVariaveis(vendaId);
  const { settings: companySettings } = useCompanySettings();

  const templatesAtivos = templates?.filter(t => t.ativo) || [];
  const templateSelecionado = templatesAtivos.find(t => t.id === templateId);

  // Sincronizar vendaId quando vendaIdInicial mudar ou modal abrir
  useEffect(() => {
    if (open && vendaIdInicial) {
      setVendaId(vendaIdInicial);
    }
  }, [open, vendaIdInicial]);

  const handleGerar = () => {
    if (!vendaId || !templateId || !templateSelecionado || !variaveis || !companySettings) {
      toast.error('Selecione uma venda e um template');
      return;
    }

    try {
      generateContratoPDF({
        template: templateSelecionado.conteudo,
        variaveis,
        numeroContrato: `CONT-${variaveis.venda_numero}-${Date.now()}`,
        companySettings
      });
      
      toast.success('Contrato gerado com sucesso!');
      toast.info('Após assinar, faça o upload do contrato assinado');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast.error('Erro ao gerar contrato');
    }
  };

  const previewConteudo = templateSelecionado && variaveis
    ? substituirVariaveis(templateSelecionado.conteudo, variaveis)
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerar Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venda">Selecione a Venda *</Label>
              <Select value={vendaId} onValueChange={setVendaId} disabled={!!vendaIdInicial}>
                <SelectTrigger id="venda">
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
              <Label htmlFor="template">Selecione o Template *</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Selecione um template" />
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
          </div>

          {vendaId && templateId && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Preview do Contrato</h3>
              {isLoadingVariaveis ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto bg-muted/30 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {previewConteudo}
                  </pre>
                </div>
              )}
            </Card>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Importante:</strong> Após gerar o PDF, imprima, assine e digitalize o contrato. 
              Depois faça o upload do documento assinado para vincular à venda.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGerar} 
            disabled={!vendaId || !templateId || isLoadingVariaveis || !companySettings}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
