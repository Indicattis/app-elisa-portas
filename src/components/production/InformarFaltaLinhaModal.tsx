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
import { AlertTriangle } from "lucide-react";

interface InformarFaltaLinhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeItem: string;
  onConfirm: (descricao: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function InformarFaltaLinhaModal({
  open,
  onOpenChange,
  nomeItem,
  onConfirm,
  isSubmitting = false,
}: InformarFaltaLinhaModalProps) {
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async () => {
    if (descricao.trim().length < 5) {
      setErro("Descreva o problema com pelo menos 5 caracteres");
      return;
    }
    
    setErro("");
    await onConfirm(descricao.trim());
    setDescricao("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDescricao("");
      setErro("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Informar Falta/Problema
          </DialogTitle>
          <DialogDescription>
            Descreva o problema com o item: <strong>{nomeItem}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ex: Material não disponível no estoque, peça com defeito, medidas incorretas..."
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (erro) setErro("");
              }}
              rows={3}
              className={erro ? "border-destructive" : ""}
            />
            {erro && (
              <p className="text-sm text-destructive">{erro}</p>
            )}
          </div>
          
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Atenção:</strong> Ao confirmar, este item será marcado com problema e a ordem será pausada automaticamente, permitindo que você capture outra ordem.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || descricao.trim().length < 5}
          >
            {isSubmitting ? "Salvando..." : "Confirmar Problema"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
