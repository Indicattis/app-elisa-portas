import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from "@dnd-kit/core";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { Button } from "@/components/ui/button";
import { DroppableDaySimpleExpedicao } from "./DroppableDaySimpleExpedicao";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { toast } from "sonner";

interface CalendarioSemanalExpedicaoDesktopProps {
  startDate: Date;
  ordens: OrdemCarregamento[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onUpdateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onOrdemCriada?: () => void;
  onOrdemDropped?: () => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
}

export const CalendarioSemanalExpedicaoDesktop = ({
  startDate,
  ordens,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onUpdateOrdem,
  onEdit,
  onRemoverDoCalendario,
  onOrdemCriada,
  onOrdemDropped,
  onOrdemClick,
}: CalendarioSemanalExpedicaoDesktopProps) => {
  const [activeOrdem, setActiveOrdem] = useState<OrdemCarregamento | null>(null);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekDayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.ordem) {
      setActiveOrdem(data.ordem as OrdemCarregamento);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveOrdem(null);

    if (!over) return;

    const novaData = over.data.current?.date as Date;
    if (!novaData) return;

    try {
      const ordemId = active.id as string;
      const ordem = ordens.find((o) => o.id === ordemId);
      if (!ordem) return;

      if (ordem.data_carregamento) {
        const dataAtual = new Date(ordem.data_carregamento);
        if (isSameDay(dataAtual, novaData)) return;
      }

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

  const handleDayClick = (date: Date) => {
    // Implementar modal de criação se necessário
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4 w-full">
        {/* Navegação da semana */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="icon" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
              {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs">
              Ir para hoje
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-4">
          {/* Headers dos dias */}
          {weekDays.map((day, index) => (
            <div key={`header-${index}`} className="text-center pb-2 border-b">
              <p className="text-sm font-semibold">{weekDayNames[index]}</p>
              <p className="text-xs text-muted-foreground">
                {format(day, "dd/MM")}
              </p>
            </div>
          ))}

          {/* Dias com ordens */}
          {weekDays.map((day) => (
            <DroppableDaySimpleExpedicao
              key={day.toISOString()}
              date={day}
              ordens={ordens}
              onDayClick={handleDayClick}
              onEdit={onEdit}
              onRemoverDoCalendario={onRemoverDoCalendario}
              onOrdemDropped={onOrdemDropped}
              onUpdateOrdem={onUpdateOrdem}
              onOrdemClick={onOrdemClick}
            />
          ))}
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeOrdem ? (
            <div className="opacity-80">
              <DraggableOrdemCarregamento
                ordem={activeOrdem}
                onEdit={onEdit}
                onRemoverDoCalendario={onRemoverDoCalendario}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
