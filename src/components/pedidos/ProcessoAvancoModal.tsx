import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProcessoStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface Processo {
  id: string;
  label: string;
  status: ProcessoStatus;
}

interface ProcessoAvancoModalProps {
  open: boolean;
  processos: Processo[];
}

export function ProcessoAvancoModal({ open, processos }: ProcessoAvancoModalProps) {
  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">Processando Avanço de Etapa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {processos.map((processo) => (
            <div 
              key={processo.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                processo.status === 'in_progress' && "bg-primary/5",
                processo.status === 'completed' && "bg-green-500/5"
              )}
            >
              {/* Ícone de status */}
              <div className="flex-shrink-0">
                {processo.status === 'pending' && (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                {processo.status === 'in_progress' && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {processo.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                )}
                {processo.status === 'error' && (
                  <Circle className="h-5 w-5 text-destructive" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  processo.status === 'pending' && "text-muted-foreground",
                  processo.status === 'in_progress' && "text-foreground",
                  processo.status === 'completed' && "text-green-700 dark:text-green-400",
                  processo.status === 'error' && "text-destructive"
                )}>
                  {processo.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground pb-2">
          Aguarde enquanto processamos...
        </div>
      </DialogContent>
    </Dialog>
  );
}
