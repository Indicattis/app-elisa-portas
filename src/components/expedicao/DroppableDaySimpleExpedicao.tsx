import { useState, useMemo } from "react";
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
import { VerMaisCardsPopover } from "./VerMaisCardsPopover";
import { Button } from "@/components/ui/button";

const MAX_VISIBLE_CARDS = 3;

interface DroppableDaySimpleExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
  neoCorrecoes?: NeoCorrecao[];
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onRemoverNeoInstalacaoDoCalendario?: (id: string) => void;
  onRemoverNeoCorrecaoDoCalendario?: (id: string) => void;
  onOrdemDropped?: () => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento>; fonte?: 'ordens_carregamento' | 'instalacoes' | 'correcoes' }) => Promise<void>;
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
  onRemoverNeoInstalacaoDoCalendario,
  onRemoverNeoCorrecaoDoCalendario,
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

  // Combine all items and slice to show only first MAX_VISIBLE_CARDS
  const { visibleOrdens, visibleNeo, visibleNeoCorrecoes, totalHidden } = useMemo(() => {
    const allItems: Array<{ type: 'ordem' | 'neo' | 'correcao'; item: OrdemCarregamento | NeoInstalacao | NeoCorrecao }> = [
      ...ordensNoDia.map(item => ({ type: 'ordem' as const, item })),
      ...neoNoDia.map(item => ({ type: 'neo' as const, item })),
      ...neoCorrecoesNoDia.map(item => ({ type: 'correcao' as const, item })),
    ];

    const totalCount = allItems.length;
    const visibleItems = allItems.slice(0, MAX_VISIBLE_CARDS);
    
    return {
      visibleOrdens: visibleItems.filter(i => i.type === 'ordem').map(i => i.item as OrdemCarregamento),
      visibleNeo: visibleItems.filter(i => i.type === 'neo').map(i => i.item as NeoInstalacao),
      visibleNeoCorrecoes: visibleItems.filter(i => i.type === 'correcao').map(i => i.item as NeoCorrecao),
      totalHidden: totalCount - MAX_VISIBLE_CARDS,
    };
  }, [ordensNoDia, neoNoDia, neoCorrecoesNoDia]);

  const handleConfirmModal = async (params: {
    ordemId: string;
    fonte?: 'ordens_carregamento' | 'instalacoes' | 'correcoes';
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
      },
      fonte: params.fonte || 'ordens_carregamento'
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
          {visibleOrdens.map((ordem) => (
            <DraggableOrdemCarregamento
              key={ordem.id}
              ordem={ordem}
              onClick={onOrdemClick}
              onEdit={readOnly ? undefined : onEdit}
              onRemoverDoCalendario={readOnly ? undefined : onRemoverDoCalendario}
              disableDrag={readOnly}
            />
          ))}
          {visibleNeo.map((neo) => (
            <DraggableNeoInstalacao
              key={neo.id}
              neoInstalacao={neo}
              onOpenDetails={onOpenNeoInstalacaoDetails}
              onExcluir={onExcluirNeoInstalacao}
              onEditar={onEditarNeoInstalacao}
              onRemover={readOnly ? undefined : onRemoverNeoInstalacaoDoCalendario}
              disableDrag={readOnly}
            />
          ))}
          {visibleNeoCorrecoes.map((neo) => (
            <DraggableNeoCorrecao
              key={neo.id}
              neoCorrecao={neo}
              onOpenDetails={onOpenNeoCorrecaoDetails}
              onExcluir={onExcluirNeoCorrecao}
              onEditar={onEditarNeoCorrecao}
              onRemover={readOnly ? undefined : onRemoverNeoCorrecaoDoCalendario}
              disableDrag={readOnly}
            />
          ))}

          {/* Ver mais button */}
          <VerMaisCardsPopover
            date={date}
            ordens={ordensNoDia}
            neoInstalacoes={neoNoDia}
            neoCorrecoes={neoCorrecoesNoDia}
            totalHidden={totalHidden}
            onEdit={onEdit}
            onRemoverDoCalendario={onRemoverDoCalendario}
            onRemoverNeoInstalacaoDoCalendario={readOnly ? undefined : onRemoverNeoInstalacaoDoCalendario}
            onRemoverNeoCorrecaoDoCalendario={readOnly ? undefined : onRemoverNeoCorrecaoDoCalendario}
            onOrdemClick={onOrdemClick}
            onOpenNeoInstalacaoDetails={onOpenNeoInstalacaoDetails}
            onOpenNeoCorrecaoDetails={onOpenNeoCorrecaoDetails}
            onExcluirNeoInstalacao={onExcluirNeoInstalacao}
            onExcluirNeoCorrecao={onExcluirNeoCorrecao}
            onEditarNeoInstalacao={onEditarNeoInstalacao}
            onEditarNeoCorrecao={onEditarNeoCorrecao}
            readOnly={readOnly}
          />
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
