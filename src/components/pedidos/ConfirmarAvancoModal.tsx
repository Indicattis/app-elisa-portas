import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ConfirmarAvancoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
  pedido: any;
  etapaAtual: string;
  proximaEtapa: string;
}

export function ConfirmarAvancoModal({ 
  open, 
  onOpenChange, 
  onConfirmar,
  pedido,
  etapaAtual,
  proximaEtapa
}: ConfirmarAvancoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Confirmar Avanço de Etapa
          </DialogTitle>
          <DialogDescription>
            Deseja avançar este pedido de etapa?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2 font-medium">{pedido?.vendas?.cliente_nome}</span>
            </div>
            {pedido?.numero_pedido && (
              <div className="text-sm">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="ml-2 font-medium">{pedido.numero_pedido}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">De:</div>
              <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
                {etapaAtual}
              </div>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Para:</div>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                {proximaEtapa}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Não
          </Button>
          <Button onClick={onConfirmar}>
            Sim, Avançar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
