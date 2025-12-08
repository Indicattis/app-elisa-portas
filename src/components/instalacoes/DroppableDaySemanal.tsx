import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { DraggableInstalacaoCalendario } from "./DraggableInstalacaoCalendario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DroppableDaySemanalProps {
  date: Date;
  instalacoes: InstalacaoCalendario[];
  onAddClick: (date: Date) => void;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
}

export const DroppableDaySemanal = ({
  date,
  instalacoes,
  onAddClick,
  onInstalacaoClick,
}: DroppableDaySemanalProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
      type: 'day',
    },
  });

  const isToday = isSameDay(date, new Date());
  const isWeekendDay = isWeekend(date);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] border rounded-lg p-2 group transition-colors",
        isOver && "bg-primary/10 border-primary ring-2 ring-primary/20",
        isToday ? "border-primary bg-primary/5" : "border-border",
        isWeekendDay && "bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b">
        <div className={cn("text-center flex-1", isToday && "text-primary font-bold")}>
          <div className="text-xs text-muted-foreground">
            {format(date, "EEE", { locale: ptBR })}
          </div>
          <div className="text-lg font-semibold">
            {format(date, "dd")}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddClick(date)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {instalacoes.map((instalacao) => (
          <DraggableInstalacaoCalendario
            key={instalacao.id}
            instalacao={instalacao}
            onClick={() => onInstalacaoClick(instalacao)}
          />
        ))}
      </div>
    </div>
  );
};
