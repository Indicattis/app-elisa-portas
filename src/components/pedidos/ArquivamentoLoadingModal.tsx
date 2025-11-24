import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ArquivamentoLoadingModalProps {
  open: boolean;
}

export function ArquivamentoLoadingModal({ open }: ArquivamentoLoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Arquivando Pedido</h3>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto o pedido está sendo arquivado...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
