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
import { Wrench, Loader2 } from "lucide-react";

interface EnviarCorrecaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-600" />
            Enviar para Correção
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deseja enviar o pedido{pedidoNumero ? ` #${pedidoNumero}` : ''} para a etapa de correção?
            Uma ordem de correção será criada e poderá ser agendada no calendário de expedição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
