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
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatarNumeroPedidoMensal } from "@/utils/pedidoFormatters";

interface ExcluirPedidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
  pedido: any;
  isLoading?: boolean;
}

export function ExcluirPedidoModal({
  open,
  onOpenChange,
  onConfirmar,
  pedido,
  isLoading = false,
}: ExcluirPedidoModalProps) {
  const vendaData = Array.isArray(pedido?.vendas) ? pedido?.vendas[0] : pedido?.vendas;
  const clienteNome = vendaData?.cliente_nome || "Cliente";
  const numeroPedido = formatarNumeroPedidoMensal(pedido?.numero_pedido, pedido?.created_at);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Pedido
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a excluir permanentemente o pedido{" "}
              <strong className="text-foreground">{numeroPedido}</strong> do cliente{" "}
              <strong className="text-foreground">{clienteNome}</strong>.
            </p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-destructive text-sm">
              <strong>⚠️ Esta ação é irreversível!</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>O pedido será excluído permanentemente</li>
                <li>Todas as linhas do pedido serão apagadas</li>
                <li>Todas as ordens de produção relacionadas serão removidas</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirmar();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Pedido"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
