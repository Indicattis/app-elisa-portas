import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isWeekend, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { AddOrdemPopover } from "./AddOrdemPopover";

interface DroppableDaySimpleExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  onDayClick: (date: Date) => void;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onOrdemDropped?: () => void;
  onUpdateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
}

export const DroppableDaySimpleExpedicao = ({
  date,
  ordens,
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onOrdemDropped,
  onUpdateOrdem,
  onOrdemClick,
}: DroppableDaySimpleExpedicaoProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
      type: 'day',
    },
  });

  const hoje = new Date();
  const isToday = isSameDay(date, hoje);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(parseISO(ordem.data_carregamento), date);
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] p-3 border rounded-lg transition-colors ${
          isOver
            ? "border-primary bg-primary/10"
            : isToday
            ? "border-primary/50 bg-primary/5"
            : isWeekendDay
            ? "bg-muted/20"
            : "bg-background"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {format(date, "EEE", { locale: ptBR })}
            </p>
          </div>
          <AddOrdemPopover
            date={date}
            onUpdateOrdem={onUpdateOrdem}
            onOrdemAdded={onOrdemDropped}
            size="icon"
            className="h-6 w-6"
          />
        </div>

        <div className="space-y-2">
          {ordensNoDia.map((ordem) => (
            <DraggableOrdemCarregamento
              key={ordem.id}
              ordem={ordem}
              onClick={onOrdemClick}
              onEdit={onEdit}
              onRemoverDoCalendario={onRemoverDoCalendario}
            />
          ))}
        </div>
      </div>
    </>
  );
};
