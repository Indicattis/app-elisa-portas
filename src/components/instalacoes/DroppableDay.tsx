import { useDroppable } from "@dnd-kit/core";
import { format, isToday, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Instalacao } from "@/types/instalacao";
import { DraggableInstalacao } from "./DraggableInstalacao";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DroppableDayProps {
  date: Date;
  currentMonth: Date;
  instalacoes: Instalacao[];
  onDayClick: (date: Date) => void;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const DroppableDay = ({
  date,
  currentMonth,
  instalacoes,
  onDayClick,
  onEdit,
  onDelete,
}: DroppableDayProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
    },
  });

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Filtrar instalações deste dia
  const dayInstalacoes = instalacoes.filter(
    (inst) => inst.data === format(date, "yyyy-MM-dd")
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] border rounded-lg p-2 space-y-1 transition-colors",
        isOver && "bg-primary/5 border-primary",
        isWeekend && "bg-muted/30",
        !isCurrentMonth && "opacity-40",
        isCurrentDay && "border-primary border-2"
      )}
    >
      {/* Header do dia */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-sm font-medium",
            isCurrentDay ? "text-primary" : "text-foreground",
            !isCurrentMonth && "text-muted-foreground"
          )}
        >
          {format(date, "d", { locale: ptBR })}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-primary/10"
          onClick={() => onDayClick(date)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Lista de instalações */}
      <div className="space-y-1">
        {dayInstalacoes.map((instalacao) => (
          <DraggableInstalacao
            key={instalacao.id}
            instalacao={instalacao}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
