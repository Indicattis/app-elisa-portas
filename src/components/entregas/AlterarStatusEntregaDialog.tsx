import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AlterarStatusEntregaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: string) => void;
  currentStatus: string;
  entregaNome: string;
}

export function AlterarStatusEntregaDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  entregaNome
}: AlterarStatusEntregaDialogProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleConfirm = () => {
    onConfirm(status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status da Entrega</DialogTitle>
          <DialogDescription>
            Alterar o status da entrega "{entregaNome}"
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
                <SelectItem value="pronta_fabrica">Pronta para Coleta</SelectItem>
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
