import { useState } from "react";
import { Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NovoInicioPinturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (observacoes?: string) => void;
  isLoading?: boolean;
}

export function NovoInicioPinturaModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: NovoInicioPinturaModalProps) {
  const [observacoes, setObservacoes] = useState("");

  const handleConfirm = () => {
    onConfirm(observacoes.trim() || undefined);
    setObservacoes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <DialogTitle>Registrar Início de Pintura</DialogTitle>
          </div>
          <DialogDescription>
            Registre o início do forno de pintura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Temperatura inicial 180°C, lote #123..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Início"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
