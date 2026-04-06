import { useState, useEffect } from "react";
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
import { Wrench, Loader2 } from "lucide-react";

interface EnviarCorrecaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (comentario: string) => void;
  isLoading?: boolean;
  pedidoNumero?: string;
}

export function EnviarCorrecaoModal({
  open,
  onOpenChange,
  onConfirmar,
  isLoading,
  pedidoNumero,
}: EnviarCorrecaoModalProps) {
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    if (!open) setComentario("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-600" />
            Enviar para Correção
          </DialogTitle>
          <DialogDescription>
            Deseja enviar o pedido{pedidoNumero ? ` #${pedidoNumero}` : ''} para a etapa de correção?
            Descreva o motivo abaixo.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva o motivo da correção..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={isLoading}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirmar(comentario)}
            disabled={isLoading || !comentario.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
