import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AgendarCarregamentoModal } from "./AgendarCarregamentoModal";

interface DroppableDaySimpleExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  onDayClick: (date: Date) => void;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onOrdemDropped?: () => void;
}

export const DroppableDaySimpleExpedicao = ({
  date,
  ordens,
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onOrdemDropped,
}: DroppableDaySimpleExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${date.toISOString()}`,
    data: { date },
  });

  const hoje = new Date();
  const isToday = isSameDay(date, hoje);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(new Date(ordem.data_carregamento), date);
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {ordensNoDia.map((ordem) => (
            <DraggableOrdemCarregamento
              key={ordem.id}
              ordem={ordem}
              onEdit={onEdit}
              onRemoverDoCalendario={onRemoverDoCalendario}
            />
          ))}
        </div>
      </div>

      <AgendarCarregamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ordem={null}
        onConfirm={async () => {
          setModalOpen(false);
          onOrdemDropped?.();
        }}
      />
    </>
  );
};
