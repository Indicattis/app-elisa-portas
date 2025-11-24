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

interface ArquivarPedidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
  pedido: any;
}

export function ArquivarPedidoModal({
  open,
  onOpenChange,
  onConfirmar,
  pedido
}: ArquivarPedidoModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar Pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja arquivar o pedido {pedido?.numero_pedido}?
            Esta ação é irreversível e o pedido será movido para o histórico de produção.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>
            Sim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
