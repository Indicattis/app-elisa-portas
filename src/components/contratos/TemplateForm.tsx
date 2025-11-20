import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContratoTemplate } from "@/types/contrato";
import { VariaveisList } from "./VariaveisList";

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<ContratoTemplate>) => void;
  template?: ContratoTemplate;
  isLoading?: boolean;
}

export function TemplateForm({ open, onOpenChange, onSubmit, template, isLoading }: TemplateFormProps) {
  const [formData, setFormData] = useState<Partial<ContratoTemplate>>({
    nome: template?.nome || '',
    descricao: template?.descricao || '',
    conteudo: template?.conteudo || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Template *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Contrato Padrão de Venda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Breve descrição do template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo do Template *</Label>
              <Textarea
                id="conteudo"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o conteúdo do contrato aqui. Use variáveis no formato {variavel} para dados dinâmicos."
                className="min-h-[400px] font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use as variáveis disponíveis na lista ao lado para inserir dados dinâmicos
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </DialogFooter>
          </form>

          <div className="overflow-y-auto">
            <VariaveisList />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
