import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isSameMonth, isToday as isTodayFn, isWeekend } from "date-fns";
import { Plus } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SelecionarOrdemModal } from "./SelecionarOrdemModal";
import { toast } from "sonner";

interface DroppableDayExpedicaoProps {
  date: Date;
  currentMonth: Date;
  ordens: OrdemCarregamento[];
  onDayClick: (date: Date) => void;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onOrdemDropped?: () => void;
  onUpdateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
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
}: DroppableDayExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${date.toISOString()}`,
    data: { date },
  });

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isToday = isTodayFn(date);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(new Date(ordem.data_carregamento), date);
  });

  const handleConfirmModal = async (
    ordemId: string,
    hora: string,
    responsavelTipo: 'elisa' | 'autorizados',
    responsavelId: string,
    responsavelNome: string
  ) => {
    try {
      await onUpdateOrdem({
        id: ordemId,
        data: {
          data_carregamento: format(date, 'yyyy-MM-dd'),
          hora: hora,
          responsavel_tipo: responsavelTipo,
          responsavel_carregamento_id: responsavelId,
          responsavel_carregamento_nome: responsavelNome,
          status: 'agendada',
        }
      });
      toast.success("Ordem adicionada ao calendário!");
      onOrdemDropped?.();
    } catch (error) {
      console.error("Erro ao adicionar ordem:", error);
      toast.error("Erro ao adicionar ordem ao calendário");
    }
  };

  return (
    <>
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
          {isCurrentMonth && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
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

      <SelecionarOrdemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dataSelecionada={date}
        onConfirm={handleConfirmModal}
      />
    </>
  );
};
