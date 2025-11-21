import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from "@dnd-kit/core";
import { Instalacao } from "@/types/instalacao";
import { Button } from "@/components/ui/button";
import { DroppableDaySimple } from "./DroppableDaySimple";
import { DraggableInstalacao } from "./DraggableInstalacao";

interface CalendarioSemanalDesktopProps {
  startDate: Date;
  instalacoes: Instalacao[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<Instalacao> }) => Promise<void>;
  onDayClick: (date: Date) => void;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const CalendarioSemanalDesktop = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onUpdateInstalacao,
  onDayClick,
  onEdit,
  onDelete,
}: CalendarioSemanalDesktopProps) => {
  const [activeInstalacao, setActiveInstalacao] = useState<Instalacao | null>(null);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekDayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const handleDragStart = (event: DragStartEvent) => {
    const instalacao = event.active.data.current?.instalacao as Instalacao;
    setActiveInstalacao(instalacao);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInstalacao(null);

    if (!over) return;

    const instalacaoId = active.id as string;
    const novaData = over.data.current?.date as Date;

    if (!novaData) return;

    const instalacao = instalacoes.find((i) => i.id === instalacaoId);
    if (!instalacao) return;

    const dataAtual = new Date(instalacao.data);
    if (isSameDay(dataAtual, novaData)) return;

    await onUpdateInstalacao({
      id: instalacaoId,
      data: {
        data: format(novaData, "yyyy-MM-dd"),
      },
    });
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

          {/* Dias com instalações */}
          {weekDays.map((day) => (
            <DroppableDaySimple
              key={day.toISOString()}
              date={day}
              instalacoes={instalacoes}
              onDayClick={onDayClick}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeInstalacao ? (
            <div className="opacity-80">
              <DraggableInstalacao
                instalacao={activeInstalacao}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
