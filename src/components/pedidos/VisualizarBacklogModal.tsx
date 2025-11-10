import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisualizarBacklogModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisualizarBacklogModal({
  pedido,
  open,
  onOpenChange
}: VisualizarBacklogModalProps) {
  const motivoBacklog = pedido.motivo_backlog;
  const dataBacklog = pedido.data_backlog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Justificativa do Backlog
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm">
                {pedido.numero_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
              </p>

              {/* Info do backlog */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    EM BACKLOG
                  </Badge>
                  {dataBacklog && (
                    <span className="text-xs text-muted-foreground">
                      desde {format(new Date(dataBacklog), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>

                {/* Justificativa */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Motivo do retorno:</p>
                  <div className="rounded-md bg-muted p-3 border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {motivoBacklog || "Sem justificativa registrada"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso */}
              <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  💡 Este pedido possui prioridade máxima e deve ser tratado com urgência.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
