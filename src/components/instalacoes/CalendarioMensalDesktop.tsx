import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Instalacao } from "@/types/instalacao";
import { DroppableDay } from "./DroppableDay";
import { InstalacaoCard } from "./InstalacaoCard";
import { toast } from "sonner";

interface CalendarioMensalDesktopProps {
  currentMonth: Date;
  instalacoes: Instalacao[];
  onMonthChange: (date: Date) => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<Instalacao> }) => Promise<void>;
  onDayClick: (date: Date) => void;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const CalendarioMensalDesktop = ({
  currentMonth,
  instalacoes,
  onMonthChange,
  onUpdateInstalacao,
  onDayClick,
  onEdit,
  onDelete,
}: CalendarioMensalDesktopProps) => {
  const [activeInstalacao, setActiveInstalacao] = useState<Instalacao | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const instalacao = event.active.data.current?.instalacao;
    if (instalacao) {
      setActiveInstalacao(instalacao);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInstalacao(null);

    if (!over || active.id === over.id) return;

    const instalacaoId = active.id as string;
    const novaData = over.data.current?.date as Date;

    if (!novaData) return;

    try {
      await onUpdateInstalacao({
        id: instalacaoId,
        data: {
          data: format(novaData, "yyyy-MM-dd"),
        },
      });
      toast.success("Data da instalação atualizada");
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data da instalação");
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              <DroppableDay
                key={day.toISOString()}
                date={day}
                currentMonth={currentMonth}
                instalacoes={instalacoes}
                onDayClick={onDayClick}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay durante o arrasto */}
      <DragOverlay>
        {activeInstalacao && (
          <div className="opacity-80">
            <InstalacaoCard
              instalacao={activeInstalacao}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
