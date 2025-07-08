
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface OrcamentoApprovalModalProps {
  orcamento: any;
  onApprove: (orcamentoId: string, desconto: number, tipo: string, observacoes: string) => Promise<void>;
  onCancel: () => void;
}

export function OrcamentoApprovalModal({ orcamento, onApprove, onCancel }: OrcamentoApprovalModalProps) {
  const [descontoAdicional, setDescontoAdicional] = useState<number>(0);
  const [tipoDesconto, setTipoDesconto] = useState<string>("percentual");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(orcamento.id, descontoAdicional, tipoDesconto, observacoes);
    } finally {
      setLoading(false);
    }
  };

  const calcularNovoValor = () => {
    const valorBase = orcamento.valor_produto + orcamento.valor_pintura + 
                    orcamento.valor_frete + orcamento.valor_instalacao;
    
    // Aplicar desconto original
    const valorComDescontoOriginal = valorBase - (valorBase * orcamento.desconto_percentual / 100);
    
    // Aplicar desconto adicional
    let valorFinal = valorComDescontoOriginal;
    if (tipoDesconto === "percentual") {
      valorFinal = valorComDescontoOriginal - (valorBase * descontoAdicional / 100);
    } else {
      valorFinal = valorComDescontoOriginal - descontoAdicional;
    }
    
    return Math.max(0, valorFinal);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprovar Orçamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Lead</Label>
              <p className="text-sm">{orcamento.elisaportas_leads?.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Valor Atual</Label>
              <p className="text-sm font-semibold">
                R$ {orcamento.valor_total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {orcamento.motivo_analise && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Motivo da Análise</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{orcamento.motivo_analise}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_desconto">Tipo de Desconto Adicional</Label>
              <Select value={tipoDesconto} onValueChange={setTipoDesconto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="valor">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto_adicional">
                Desconto Adicional {tipoDesconto === "percentual" ? "(%)" : "(R$)"}
              </Label>
              <Input
                id="desconto_adicional"
                type="number"
                step={tipoDesconto === "percentual" ? "1" : "0.01"}
                min="0"
                max={tipoDesconto === "percentual" ? "100" : undefined}
                value={descontoAdicional}
                onChange={(e) => setDescontoAdicional(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Valor Original:</span>
              <span className="text-sm">
                R$ {orcamento.valor_total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Desconto Adicional:</span>
              <span className="text-sm">
                {tipoDesconto === "percentual" 
                  ? `${descontoAdicional}%` 
                  : `R$ ${descontoAdicional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              </span>
            </div>
            <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
              <span>Novo Valor Total:</span>
              <span className="text-primary">
                R$ {calcularNovoValor().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações da Aprovação</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre a aprovação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? "Aprovando..." : "Aprovar Orçamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
