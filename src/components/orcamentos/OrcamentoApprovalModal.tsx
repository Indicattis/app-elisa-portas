import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OrcamentoApprovalModalProps {
  orcamento: any;
  onApprove: (orcamentoId: string, desconto_adicional: number, observacoes: string) => Promise<void>;
  onCancel: () => void;
}

export function OrcamentoApprovalModal({ orcamento, onApprove, onCancel }: OrcamentoApprovalModalProps) {
  const [approvalData, setApprovalData] = useState({
    desconto_adicional: 0,
    observacoes: ""
  });

  const handleApprove = async () => {
    await onApprove(orcamento.id, approvalData.desconto_adicional, approvalData.observacoes);
    onCancel();
  };

  if (!orcamento) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Aprovar Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lead: {orcamento.elisaportas_leads?.nome}</Label>
            <p className="text-sm text-muted-foreground">
              Valor Atual: R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Desconto Adicional (%)</Label>
            <Select 
              value={approvalData.desconto_adicional.toString()} 
              onValueChange={(value) => setApprovalData(prev => ({ ...prev, desconto_adicional: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sem desconto adicional</SelectItem>
                <SelectItem value="5">5% de desconto adicional</SelectItem>
                <SelectItem value="10">10% de desconto adicional</SelectItem>
                <SelectItem value="15">15% de desconto adicional</SelectItem>
                <SelectItem value="20">20% de desconto adicional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a aprovação..."
              value={approvalData.observacoes}
              onChange={(e) => setApprovalData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleApprove}>
              Aprovar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}