import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";
import { DroppableDaySemanal } from "./DroppableDaySemanal";
import { toast } from "sonner";

interface CalendarioInstalacoesSemanalProps {
  startDate: Date;
  instalacoes: InstalacaoCalendario[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<InstalacaoCalendario> }) => Promise<void>;
  onRemoverDoCalendario: (id: string) => Promise<void>;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onRefresh?: () => void;
}

export const CalendarioInstalacoesSemanal = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onUpdateInstalacao,
  onInstalacaoClick,
}: CalendarioInstalacoesSemanalProps) => {
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

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getInstalacoesDoDia = (date: Date) => {
    return instalacoes.filter(inst => {
      if (!inst.data_instalacao) return false;
      return isSameDay(parseISO(inst.data_instalacao), date);
    });
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
            <Button variant="outline" size="icon" onClick={onPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday}>
              Hoje
            </Button>
          </div>
          <h3 className="font-semibold">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMMM yyyy", { locale: ptBR })}
          </h3>
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const instalacoesDoDia = getInstalacoesDoDia(day);

            return (
              <DroppableDaySemanal
                key={day.toISOString()}
                date={day}
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
