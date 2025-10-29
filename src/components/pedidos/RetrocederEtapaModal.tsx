import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getEtapaAnterior } from "@/types/pedidoEtapa";

interface RetrocederEtapaModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (pedidoId: string) => void;
}

export function RetrocederEtapaModal({
  pedido,
  open,
  onOpenChange,
  onConfirmar
}: RetrocederEtapaModalProps) {
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const etapaAnterior = getEtapaAnterior(etapaAtual);
  const configAtual = ETAPAS_CONFIG[etapaAtual];
  const configAnterior = etapaAnterior ? ETAPAS_CONFIG[etapaAnterior] : null;

  if (!etapaAnterior || !configAnterior) {
    return null;
  }

  const handleConfirmar = () => {
    onConfirmar(pedido.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Retroceder Pedido
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p className="text-sm">
                {pedido.numero_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
              </p>

              {/* Etapas */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Etapa Atual:</span>
                  <Badge className={`${configAtual.color} text-white text-xs`}>
                    {configAtual.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Retroceder para:</span>
                  <Badge className={`${configAnterior.color} text-white text-xs`}>
                    {configAnterior.label}
                  </Badge>
                </div>
              </div>

              {/* Aviso */}
              <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  ⚠️ Esta ação irá retroceder o pedido para a etapa anterior. 
                  Os checkboxes da etapa atual serão desmarcados e o pedido voltará 
                  para a etapa anterior.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retroceder Etapa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
