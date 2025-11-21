import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContratoTemplate } from "@/types/contrato";
import { VariaveisList } from "./VariaveisList";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.conteudo || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setFormData({ ...formData, conteudo: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const applyFormatting = (tag: string) => {
    insertFormatting(`<${tag}>`, `</${tag}>`);
  };

  const applyAlignment = (align: string) => {
    insertFormatting(`<div style="text-align: ${align};">`, `</div>`);
  };

  const applyFontSize = (size: string) => {
    insertFormatting(`<span style="font-size: ${size};">`, `</span>`);
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
              
              {/* Toolbar de Formatação */}
              <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md bg-muted/50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Tamanho da fonte">
                      <Type className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => applyFontSize('12px')}>
                      Pequeno
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyFontSize('16px')}>
                      Normal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyFontSize('20px')}>
                      Grande
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyFontSize('24px')}>
                      Muito Grande
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6" />

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormatting('b')}
                  title="Negrito"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormatting('i')}
                  title="Itálico"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormatting('u')}
                  title="Sublinhado"
                >
                  <Underline className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => insertFormatting('• ', '\n')}
                  title="Lista não ordenada"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => insertFormatting('1. ', '\n')}
                  title="Lista ordenada"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyAlignment('left')}
                  title="Alinhar à esquerda"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyAlignment('center')}
                  title="Alinhar ao centro"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyAlignment('right')}
                  title="Alinhar à direita"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                ref={textareaRef}
                id="conteudo"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o conteúdo do contrato aqui. Use variáveis no formato {variavel} para dados dinâmicos."
                className="min-h-[400px] font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use as variáveis disponíveis na lista ao lado e os botões de formatação acima para estilizar o texto
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
