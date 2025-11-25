import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfirmarExpedicaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
  pedido: any;
  etapaAtual: string;
}

export function ConfirmarExpedicaoModal({ 
  open, 
  onOpenChange, 
  onConfirmar,
  pedido,
  etapaAtual
}: ConfirmarExpedicaoModalProps) {
  const tipoEntrega = pedido?.vendas?.tipo_entrega;
  const isInstalacao = tipoEntrega === 'instalacao';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Finalizar Pedido
          </DialogTitle>
          <DialogDescription>
            O carregamento foi concluído. Deseja finalizar este pedido?
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
            <div className="text-sm">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="ml-2 font-medium capitalize">{isInstalacao ? 'Instalação' : 'Coleta'}</span>
            </div>
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
              <div className="px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-sm font-medium">
                Finalizado
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                A ordem de carregamento foi concluída com sucesso em Expedição.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} className="bg-green-600 hover:bg-green-700">
            Sim, Finalizar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
