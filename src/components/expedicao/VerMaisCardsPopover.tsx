import { useState } from "react";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { DraggableNeoInstalacao } from "./DraggableNeoInstalacao";
import { DraggableNeoCorrecao } from "./DraggableNeoCorrecao";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VerMaisCardsPopoverProps {
  date: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes: NeoInstalacao[];
  neoCorrecoes: NeoCorrecao[];
  totalHidden: number;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onRemoverNeoInstalacaoDoCalendario?: (id: string) => void;
  onRemoverNeoCorrecaoDoCalendario?: (id: string) => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  onOpenNeoInstalacaoDetails?: (neoInstalacao: NeoInstalacao) => void;
  onOpenNeoCorrecaoDetails?: (neoCorrecao: NeoCorrecao) => void;
  onExcluirNeoInstalacao?: (id: string) => void;
  onExcluirNeoCorrecao?: (id: string) => void;
  onEditarNeoInstalacao?: (neo: NeoInstalacao) => void;
  onEditarNeoCorrecao?: (neo: NeoCorrecao) => void;
  readOnly?: boolean;
}

export const VerMaisCardsPopover = ({
  date,
  ordens,
  neoInstalacoes,
  neoCorrecoes,
  totalHidden,
  onEdit,
  onRemoverDoCalendario,
  onRemoverNeoInstalacaoDoCalendario,
  onRemoverNeoCorrecaoDoCalendario,
  onOrdemClick,
  onOpenNeoInstalacaoDetails,
  onOpenNeoCorrecaoDetails,
  onExcluirNeoInstalacao,
  onExcluirNeoCorrecao,
  onEditarNeoInstalacao,
  onEditarNeoCorrecao,
  readOnly = false,
}: VerMaisCardsPopoverProps) => {
  const [open, setOpen] = useState(false);

  // Close modal when drag starts so user can drop on calendar
  useDndMonitor({
    onDragStart: () => {
      if (open) {
        setOpen(false);
      }
    },
  });

  const { setNodeRef, isOver } = useDroppable({
    id: `modal-${format(date, "yyyy-MM-dd")}`,
    data: {
      date,
      type: 'day',
    },
    disabled: !open,
  });

  const totalCards = ordens.length + neoInstalacoes.length + neoCorrecoes.length;

  if (totalHidden <= 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-6 text-xs text-muted-foreground hover:text-foreground gap-1"
        onClick={() => setOpen(true)}
      >
        <ChevronDown className="h-3 w-3" />
        +{totalHidden} mais
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({totalCards} {totalCards === 1 ? "item" : "itens"})
              </span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div
              ref={setNodeRef}
              className={`space-y-2 p-1 rounded-md transition-colors ${
                isOver ? "bg-primary/10" : ""
              }`}
            >
              {ordens.map((ordem) => (
                <DraggableOrdemCarregamento
                  key={ordem.id}
                  ordem={ordem}
                  onClick={onOrdemClick}
                  onEdit={readOnly ? undefined : onEdit}
                  onRemoverDoCalendario={readOnly ? undefined : onRemoverDoCalendario}
                  disableDrag={readOnly}
                />
              ))}
              {neoInstalacoes.map((neo) => (
                <DraggableNeoInstalacao
                  key={neo.id}
                  neoInstalacao={neo}
                  onOpenDetails={onOpenNeoInstalacaoDetails}
                  onExcluir={onExcluirNeoInstalacao}
                  onEditar={onEditarNeoInstalacao}
                  onRemover={readOnly ? undefined : onRemoverNeoInstalacaoDoCalendario}
                  disableDrag={readOnly}
                />
              ))}
              {neoCorrecoes.map((neo) => (
                <DraggableNeoCorrecao
                  key={neo.id}
                  neoCorrecao={neo}
                  onOpenDetails={onOpenNeoCorrecaoDetails}
                  onExcluir={onExcluirNeoCorrecao}
                  onEditar={onEditarNeoCorrecao}
                  onRemover={readOnly ? undefined : onRemoverNeoCorrecaoDoCalendario}
                  disableDrag={readOnly}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
