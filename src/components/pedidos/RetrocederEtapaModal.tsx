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
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Resetar Pedido
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
                  <span className="text-sm text-muted-foreground">Será resetado para:</span>
                  <Badge className="bg-gray-500 text-white text-xs">
                    Aberto
                  </Badge>
                </div>
              </div>

              {/* Aviso */}
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-700 dark:text-red-300 font-semibold mb-2">
                  ⚠️ ATENÇÃO: Esta ação irá RESETAR COMPLETAMENTE o pedido!
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                  <li>O pedido voltará para a etapa "Aberto"</li>
                  <li>Todas as linhas de produção serão desmarcadas</li>
                  <li>Todos os checkboxes de qualidade serão desmarcados</li>
                  <li>Todas as ordens de produção serão resetadas</li>
                  <li>As linhas cadastradas no pedido serão mantidas</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmar} className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Resetar para Início
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
