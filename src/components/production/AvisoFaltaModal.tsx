import { useState } from "react";
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
import { AlertTriangle, PauseCircle } from "lucide-react";

interface AvisoFaltaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroOrdem: string;
  onConfirm: (justificativa: string) => Promise<void>;
  isPausing?: boolean;
}

export function AvisoFaltaModal({
  open,
  onOpenChange,
  numeroOrdem,
  onConfirm,
  isPausing = false,
}: AvisoFaltaModalProps) {
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (justificativa.trim().length < 10) {
      setError("A justificativa deve ter pelo menos 10 caracteres");
      return;
    }

    setError(null);
    await onConfirm(justificativa);
    setJustificativa("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setJustificativa("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Aviso de Falta
          </DialogTitle>
          <DialogDescription>
            Você está pausando a ordem <span className="font-semibold">{numeroOrdem}</span>.
            Informe o motivo para a pausa (falta de material, problema técnico, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa *</Label>
            <Textarea
              id="justificativa"
              placeholder="Ex: Falta de perfil L 40mm, aguardando reposição do fornecedor..."
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              className="resize-none"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo de 10 caracteres ({justificativa.length}/10)
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Atenção:</strong> Ao pausar, o cronômetro será interrompido e a ordem ficará disponível para outro operador retomar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPausing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPausing || justificativa.trim().length < 10}
          >
            <PauseCircle className="h-4 w-4 mr-2" />
            {isPausing ? "Pausando..." : "Pausar Ordem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
