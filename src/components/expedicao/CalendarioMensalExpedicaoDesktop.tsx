import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, TouchSensor, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { DroppableDayExpedicao } from "./DroppableDayExpedicao";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";
import { CalendarioLegendas } from "./CalendarioLegendas";
import { toast } from "sonner";

interface CalendarioMensalExpedicaoDesktopProps {
  currentMonth: Date;
  ordens: OrdemCarregamento[];
  onMonthChange: (date: Date) => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onOrdemCriada?: () => void;
  onOrdemDropped?: () => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  readOnly?: boolean;
}

export const CalendarioMensalExpedicaoDesktop = ({
  currentMonth,
  ordens,
  onMonthChange,
  onUpdateOrdem,
  onEdit,
  onRemoverDoCalendario,
  onOrdemCriada,
  onOrdemDropped,
  onOrdemClick,
  readOnly = false,
}: CalendarioMensalExpedicaoDesktopProps) => {
  const [activeOrdem, setActiveOrdem] = useState<OrdemCarregamento | null>(null);

  // Configurar sensores para mobile e desktop
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.ordem) {
      setActiveOrdem(data.ordem);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveOrdem(null);

    if (!over || active.id === over.id) return;

    const novaData = over.data.current?.date as Date;
    if (!novaData) return;

    try {
      const ordemId = active.id as string;
      const dataFormatada = format(novaData, "yyyy-MM-dd");
      
      await onUpdateOrdem({
        id: ordemId,
        data: {
          data_carregamento: dataFormatada,
          status: 'agendada',
        },
      });
      toast.success("Data de carregamento atualizada");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  // Calcular dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleDayClick = (date: Date) => {
    // Implementar modal de criação se necessário
  };

  const calendarContent = (
    <div className="space-y-4">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold text-foreground min-w-[200px] text-center">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(new Date())}
        >
          Ir para hoje
        </Button>
      </div>

      {/* Legendas */}
      <CalendarioLegendas />

      {/* Grid do calendário */}
      <div className="rounded-lg overflow-hidden bg-muted/20 border border-border">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <DroppableDayExpedicao
              key={day.toISOString()}
              date={day}
              currentMonth={currentMonth}
              ordens={ordens}
              onDayClick={handleDayClick}
              onEdit={readOnly ? undefined : onEdit}
              onRemoverDoCalendario={readOnly ? undefined : onRemoverDoCalendario}
              onOrdemDropped={readOnly ? undefined : onOrdemDropped}
              onUpdateOrdem={readOnly ? undefined : onUpdateOrdem}
              onOrdemClick={onOrdemClick}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Se readOnly, não usar DndContext (desabilita drag & drop)
  if (readOnly) {
    return calendarContent;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {calendarContent}

      {/* Overlay durante o arrasto */}
      <DragOverlay>
        {activeOrdem && (
          <div className="opacity-80">
            <OrdemCarregamentoCard
              ordem={activeOrdem}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
