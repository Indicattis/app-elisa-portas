import { Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const now = new Date();
  const dataFormatada = format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const horaFormatada = format(now, "HH:mm", { locale: ptBR });

  const handleConfirm = () => {
    onConfirm();
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
            <DialogTitle>Confirmar Início de Fornada</DialogTitle>
          </div>
          <DialogDescription>
            Confirme o registro do início do forno de pintura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="text-lg font-semibold">{dataFormatada}</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Horário</p>
            <p className="text-lg font-semibold">{horaFormatada}</p>
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
            {isLoading ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
