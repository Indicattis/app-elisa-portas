import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MotivoPerda } from "@/types/orcamento";

interface OrcamentoStatusModalProps {
  orcamento: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orcamentoId: string, novoStatus: number, motivoPerda?: MotivoPerda, justificativa?: string) => void;
}

const MOTIVOS_PERDA = [
  { value: 'preco', label: 'Preço' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'logistica', label: 'Logística' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'produto', label: 'Produto' }
];

const getStatusNumber = (status: string) => {
  const statusMap: { [key: string]: number } = {
    'pendente': 1,
    'congelado': 2,
    'perdido': 3,
    'vendido': 4,
    'reprovado': 5
  };
  return statusMap[status] || 1;
};

export function OrcamentoStatusModal({ orcamento, open, onOpenChange, onStatusChange }: OrcamentoStatusModalProps) {
  const [novoStatus, setNovoStatus] = useState<number>(getStatusNumber(orcamento?.status) || 1);
  const [motivoPerda, setMotivoPerda] = useState<MotivoPerda>();
  const [justificativa, setJustificativa] = useState("");

  const handleSubmit = () => {
    onStatusChange(orcamento.id, novoStatus, motivoPerda, justificativa);
    onOpenChange(false);
    setMotivoPerda(undefined);
    setJustificativa("");
  };

  const getStatusOptions = () => {
    const currentStatus = getStatusNumber(orcamento?.status) || 1;
    
    // Status que podem ser alterados baseado no status atual
    switch (currentStatus) {
      case 1: // Em aberto
        return [
          { value: 1, label: "Em aberto" },
          { value: 2, label: "Congelado" },
          { value: 3, label: "Perdido" },
          { value: 4, label: "Vendido" }
        ];
      case 2: // Congelado
        return [
          { value: 1, label: "Em aberto" },
          { value: 2, label: "Congelado" },
          { value: 3, label: "Perdido" },
          { value: 4, label: "Vendido" }
        ];
      default:
        return [{ value: currentStatus, label: getStatusLabel(currentStatus) }];
    }
  };

  const getStatusLabel = (status: number) => {
    const labels = {
      1: "Em aberto",
      2: "Congelado",
      3: "Perdido", 
      4: "Vendido",
      5: "Venda reprovada"
    };
    return labels[status as keyof typeof labels] || "Desconhecido";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status do Orçamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Novo Status</Label>
            <Select value={novoStatus.toString()} onValueChange={(value) => setNovoStatus(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {novoStatus === 3 && (
            <>
              <div>
                <Label htmlFor="motivo">Motivo da Perda</Label>
                <Select value={motivoPerda} onValueChange={(value) => setMotivoPerda(value as MotivoPerda)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_PERDA.map((motivo) => (
                      <SelectItem key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea
                  id="justificativa"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Descreva o motivo da perda..."
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={novoStatus === 3 && (!motivoPerda || !justificativa.trim())}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}