import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isSameMonth, isToday as isTodayFn, isWeekend, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { DraggableNeoInstalacao } from "./DraggableNeoInstalacao";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { Button } from "@/components/ui/button";

interface DroppableDayExpedicaoProps {
  date: Date;
  currentMonth: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
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
  neoInstalacoes = [],
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onOrdemDropped,
  onUpdateOrdem,
  onOrdemClick,
  readOnly = false,
}: DroppableDayExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);

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

  const neoNoDia = neoInstalacoes.filter((neo) => {
    if (!neo.data_instalacao) return false;
    return isSameDay(parseISO(neo.data_instalacao), date);
  });

  const handleConfirmModal = async (params: {
    ordemId: string;
    data_carregamento: string;
    hora: string;
    tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
    responsavel_carregamento_id: string | null;
    responsavel_carregamento_nome: string;
  }) => {
    if (!onUpdateOrdem) return;

    await onUpdateOrdem({
      id: params.ordemId,
      data: {
        data_carregamento: params.data_carregamento,
        hora: params.hora,
        tipo_carregamento: params.tipo_carregamento,
        responsavel_carregamento_id: params.responsavel_carregamento_id,
        responsavel_carregamento_nome: params.responsavel_carregamento_nome,
        status: 'agendada'
      }
    });

    onOrdemDropped?.();
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
          {isCurrentMonth && !readOnly && onUpdateOrdem && (
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
              onClick={onOrdemClick}
              onEdit={readOnly ? undefined : onEdit}
              onRemoverDoCalendario={readOnly ? undefined : onRemoverDoCalendario}
              disableDrag={readOnly}
            />
          ))}
          {neoNoDia.map((neo) => (
            <DraggableNeoInstalacao
              key={neo.id}
              neoInstalacao={neo}
              disableDrag={readOnly}
            />
          ))}
        </div>
      </div>

      <AdicionarOrdemCalendarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dataSelecionada={date}
        onConfirm={handleConfirmModal}
      />
    </>
  );
};
