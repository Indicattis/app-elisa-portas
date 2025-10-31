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

interface AvancarQualidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function AvancarQualidadeModal({ 
  open, 
  onOpenChange, 
  onConfirmar 
}: AvancarQualidadeModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Avançar para Inspeção da Qualidade?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao confirmar, o pedido avançará para a etapa de Inspeção da Qualidade 
            e uma ordem de qualidade será criada automaticamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>
            Sim, avançar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
