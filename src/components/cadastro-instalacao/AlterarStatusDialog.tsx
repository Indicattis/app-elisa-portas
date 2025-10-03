import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AlterarStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: string) => void;
  currentStatus: string;
  instalacaoNome: string;
}

export function AlterarStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  instalacaoNome
}: AlterarStatusDialogProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleConfirm = () => {
    onConfirm(status);
    onOpenChange(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente_producao': return 'Pendente Produção';
      case 'pronta_fabrica': return 'Pronta Fábrica';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status</DialogTitle>
          <DialogDescription>
            Alterar o status da instalação "{instalacaoNome}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
                <SelectItem value="pronta_fabrica">Pronta Fábrica</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
