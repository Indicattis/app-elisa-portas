import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AlterarParaCorrecaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justificativa: string) => void;
  instalacaoNome: string;
}

export function AlterarParaCorrecaoDialog({
  open,
  onOpenChange,
  onConfirm,
  instalacaoNome
}: AlterarParaCorrecaoDialogProps) {
  const [justificativa, setJustificativa] = useState("");

  const handleConfirm = () => {
    if (!justificativa.trim()) {
      return;
    }
    onConfirm(justificativa);
    setJustificativa("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar para Correção</DialogTitle>
          <DialogDescription>
            Você está alterando a instalação "{instalacaoNome}" para correção.
            Por favor, informe a justificativa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="justificativa">Justificativa *</Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva o motivo da correção..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!justificativa.trim()}
          >
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
