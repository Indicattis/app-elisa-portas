import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, isWeekend, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { DraggableOrdemCarregamento } from "./DraggableOrdemCarregamento";
import { DraggableNeoInstalacao } from "./DraggableNeoInstalacao";
import { DraggableNeoCorrecao } from "./DraggableNeoCorrecao";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { Button } from "@/components/ui/button";

interface DroppableDaySimpleExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
  neoCorrecoes?: NeoCorrecao[];
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onOrdemDropped?: () => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  onOpenNeoInstalacaoDetails?: (neoInstalacao: NeoInstalacao) => void;
  onOpenNeoCorrecaoDetails?: (neoCorrecao: NeoCorrecao) => void;
  onExcluirNeoInstalacao?: (id: string) => void;
  onExcluirNeoCorrecao?: (id: string) => void;
  onEditarNeoInstalacao?: (neo: NeoInstalacao) => void;
  onEditarNeoCorrecao?: (neo: NeoCorrecao) => void;
  readOnly?: boolean;
}

export const DroppableDaySimpleExpedicao = ({
  date,
  ordens,
  neoInstalacoes = [],
  neoCorrecoes = [],
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onOrdemDropped,
  onUpdateOrdem,
  onOrdemClick,
  onOpenNeoInstalacaoDetails,
  onOpenNeoCorrecaoDetails,
  onExcluirNeoInstalacao,
  onExcluirNeoCorrecao,
  onEditarNeoInstalacao,
  onEditarNeoCorrecao,
  readOnly = false,
}: DroppableDaySimpleExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);

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

  const neoNoDia = neoInstalacoes.filter((neo) => {
    if (!neo.data_instalacao) return false;
    return isSameDay(parseISO(neo.data_instalacao), date);
  });

  const neoCorrecoesNoDia = neoCorrecoes.filter((neo) => {
    if (!neo.data_correcao) return false;
    return isSameDay(parseISO(neo.data_correcao), date);
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
          {!readOnly && onUpdateOrdem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
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
              onOpenDetails={onOpenNeoInstalacaoDetails}
              onExcluir={onExcluirNeoInstalacao}
              onEditar={onEditarNeoInstalacao}
              disableDrag={readOnly}
            />
          ))}
          {neoCorrecoesNoDia.map((neo) => (
            <DraggableNeoCorrecao
              key={neo.id}
              neoCorrecao={neo}
              onOpenDetails={onOpenNeoCorrecaoDetails}
              onExcluir={onExcluirNeoCorrecao}
              onEditar={onEditarNeoCorrecao}
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
