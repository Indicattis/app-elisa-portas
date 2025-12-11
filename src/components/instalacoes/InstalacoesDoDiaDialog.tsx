import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";

interface InstalacoesDoDiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  instalacoes: InstalacaoCalendario[];
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
}

export const InstalacoesDoDiaDialog = ({
  open,
  onOpenChange,
  date,
  instalacoes,
  onInstalacaoClick,
}: InstalacoesDoDiaDialogProps) => {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Instalações de {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            {instalacoes.map((instalacao) => (
              <InstalacaoCard
                key={instalacao.id}
                instalacao={instalacao}
                onClick={() => {
                  onInstalacaoClick(instalacao);
                  onOpenChange(false);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
