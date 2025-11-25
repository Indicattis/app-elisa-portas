import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Truck } from "lucide-react";

interface CarregamentoLoadingModalProps {
  open: boolean;
  success?: boolean;
}

export function CarregamentoLoadingModal({ open, success = false }: CarregamentoLoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {success ? (
            <>
              <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Carregamento Concluído!</h3>
                <p className="text-sm text-muted-foreground">
                  O carregamento foi finalizado com sucesso
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Truck className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Concluindo Carregamento</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto o carregamento está sendo finalizado...
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
