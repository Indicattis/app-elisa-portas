import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isSameMonth, isToday as isTodayFn, isWeekend, parseISO } from "date-fns";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { AddOrdemPopover } from "./AddOrdemPopover";

interface DroppableDayExpedicaoProps {
  date: Date;
  currentMonth: Date;
  ordens: OrdemCarregamento[];
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onOrdemDropped?: () => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  readOnly?: boolean;
}

export const DroppableDayExpedicao = ({
  date,
  currentMonth,
  ordens,
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onOrdemDropped,
  onUpdateOrdem,
  onOrdemClick,
  readOnly = false,
}: DroppableDayExpedicaoProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
      type: 'day',
    },
  });

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isToday = isTodayFn(date);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(parseISO(ordem.data_carregamento), date);
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 border-r border-b transition-colors ${
        isOver
          ? "bg-primary/10"
          : isToday
          ? "bg-primary/5 border-primary/30"
          : !isCurrentMonth
          ? "bg-muted/30 opacity-50"
          : isWeekendDay
          ? "bg-muted/20"
          : "bg-background"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className={`text-sm font-medium ${
            isToday
              ? "text-primary font-bold"
              : !isCurrentMonth
              ? "text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {format(date, "d")}
        </span>
        {isCurrentMonth && !readOnly && onUpdateOrdem && (
          <AddOrdemPopover
            date={date}
            onUpdateOrdem={onUpdateOrdem}
            onOrdemAdded={onOrdemDropped}
            size="icon"
            className="h-5 w-5"
          />
        )}
      </div>

      <div className="space-y-1.5">
        {ordensNoDia.map((ordem) => (
          <DraggableOrdemCarregamento
            key={ordem.id}
            ordem={ordem}
            onClick={onOrdemClick}
            onEdit={readOnly ? undefined : onEdit}
            onRemoverDoCalendario={readOnly ? undefined : onRemoverDoCalendario}
            disableDrag={readOnly}
          />
        ))}
      </div>
    </div>
  );
};
