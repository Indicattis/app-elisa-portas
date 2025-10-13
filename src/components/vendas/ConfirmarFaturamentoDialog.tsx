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

interface ConfirmarFaturamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtosComLucroZero: number;
  onConfirmar: () => void;
}

export const ConfirmarFaturamentoDialog = ({
  open,
  onOpenChange,
  produtosComLucroZero,
  onConfirmar,
}: ConfirmarFaturamentoDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Faturamento</AlertDialogTitle>
          <AlertDialogDescription>
            Há {produtosComLucroZero} item(ns) com lucro R$ 0,00 nesta venda. Deseja continuar mesmo assim?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>
            Sim, Faturar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
