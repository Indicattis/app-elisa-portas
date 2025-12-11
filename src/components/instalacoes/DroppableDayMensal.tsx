import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isSameMonth } from "date-fns";
import { Plus } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { DraggableInstalacaoCalendario } from "./DraggableInstalacaoCalendario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DroppableDayMensalProps {
  date: Date;
  currentMonth: Date;
  instalacoes: InstalacaoCalendario[];
  onAddClick: (date: Date) => void;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onShowMore?: (date: Date, instalacoes: InstalacaoCalendario[]) => void;
}

export const DroppableDayMensal = ({
  date,
  currentMonth,
  instalacoes,
  onAddClick,
  onInstalacaoClick,
  onShowMore,
}: DroppableDayMensalProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
      type: 'day',
    },
  });

  const isToday = isSameDay(date, new Date());
  const isCurrentMonth = isSameMonth(date, currentMonth);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] border rounded-lg p-1 group transition-colors",
        isOver && "bg-primary/10 border-primary ring-2 ring-primary/20",
        isToday ? "border-primary bg-primary/5" : "border-border",
        !isCurrentMonth && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn(
          "text-sm",
          isToday ? "text-primary font-bold" : "text-muted-foreground"
        )}>
          {format(date, "d")}
        </div>
        {isCurrentMonth && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onAddClick(date)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-1 mt-1">
        {instalacoes.slice(0, 3).map((instalacao) => (
          <DraggableInstalacaoCalendario
            key={instalacao.id}
            instalacao={instalacao}
            onClick={() => onInstalacaoClick(instalacao)}
            compact
          />
        ))}
        {instalacoes.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore?.(date, instalacoes);
            }}
            className="text-xs text-primary hover:text-primary/80 text-center w-full cursor-pointer hover:underline transition-colors"
          >
            +{instalacoes.length - 3} mais
          </button>
        )}
      </div>
    </div>
  );
};
