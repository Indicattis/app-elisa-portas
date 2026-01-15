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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface RemoverResponsavelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  responsavelNome: string | null;
  responsavelFoto: string | null;
  nomeSetor: string;
  isLoading?: boolean;
}

export function RemoverResponsavelModal({
  open,
  onOpenChange,
  onConfirm,
  responsavelNome,
  responsavelFoto,
  nomeSetor,
  isLoading = false,
}: RemoverResponsavelModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover responsável</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja remover o responsável desta ordem de {nomeSetor.toLowerCase()}?
              </p>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {responsavelFoto ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={responsavelFoto} />
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{responsavelNome || 'Responsável'}</p>
                  <p className="text-sm text-muted-foreground">{nomeSetor}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                A ordem voltará para o status "pendente" e ficará disponível para ser capturada novamente.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
