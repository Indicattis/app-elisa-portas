import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";
import { DroppableDayMensal } from "./DroppableDayMensal";
import { toast } from "sonner";

interface CalendarioInstalacoesMensalProps {
  currentMonth: Date;
  instalacoes: InstalacaoCalendario[];
  onMonthChange: (date: Date) => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<InstalacaoCalendario> }) => Promise<void>;
  onRemoverDoCalendario: (id: string) => Promise<void>;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onRefresh?: () => void;
}

export const CalendarioInstalacoesMensal = ({
  currentMonth,
  instalacoes,
  onMonthChange,
  onUpdateInstalacao,
  onInstalacaoClick,
}: CalendarioInstalacoesMensalProps) => {
  const navigate = useNavigate();
  const [activeInstalacao, setActiveInstalacao] = useState<InstalacaoCalendario | null>(null);

  // Sensors com delay de 0.5 segundo para ativar o drag
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 500,
      tolerance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 500,
      tolerance: 5,
    },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    const daysArray: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    return daysArray;
  }, [calendarStart, calendarEnd]);

  const getInstalacoesDoDia = (date: Date) => {
    return instalacoes.filter(inst => {
      if (!inst.data_instalacao) return false;
      return isSameDay(parseISO(inst.data_instalacao), date);
    });
  };

  const handlePreviousMonth = () => {
    onMonthChange(addDays(monthStart, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(addDays(monthEnd, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const handleAddClick = (date: Date) => {
    navigate(`/instalacoes/nova?data=${format(date, 'yyyy-MM-dd')}`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.instalacao) {
      setActiveInstalacao(data.instalacao as InstalacaoCalendario);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInstalacao(null);

    if (!over) return;

    const novaData = over.data.current?.date as Date;
    if (!novaData) return;

    const instalacaoId = active.id as string;
    const instalacao = instalacoes.find((i) => i.id === instalacaoId);
    if (!instalacao || !instalacao.data_instalacao) return;

    const dataAtual = parseISO(instalacao.data_instalacao);
    if (isSameDay(dataAtual, novaData)) return;

    try {
      await onUpdateInstalacao({
        id: instalacaoId,
        data: {
          data_instalacao: format(novaData, "yyyy-MM-dd"),
        },
      });
      toast.success("Instalação movida com sucesso!");
    } catch (error) {
      console.error("Erro ao mover instalação:", error);
      toast.error("Erro ao mover instalação");
    }
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Navegação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
          </div>
          <h3 className="font-semibold text-lg">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
        </div>

        {/* Header dos dias da semana */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const instalacoesDoDia = getInstalacoesDoDia(day);

            return (
              <DroppableDayMensal
                key={day.toISOString()}
                date={day}
                currentMonth={currentMonth}
                instalacoes={instalacoesDoDia}
                onAddClick={handleAddClick}
                onInstalacaoClick={onInstalacaoClick}
              />
            );
          })}
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeInstalacao ? (
            <div className="opacity-80">
              <InstalacaoCard
                instalacao={activeInstalacao}
                onClick={() => {}}
                compact
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
