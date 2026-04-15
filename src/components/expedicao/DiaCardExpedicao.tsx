import { useState, useMemo } from "react";
import { format, isSameDay, isWeekend, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";
import { NeoInstalacaoCard } from "./NeoInstalacaoCard";
import { NeoCorrecaoCard } from "./NeoCorrecaoCard";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { VerMaisCardsPopover } from "./VerMaisCardsPopover";

const MAX_VISIBLE_CARDS = 3;

interface DiaCardExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
  neoCorrecoes?: NeoCorrecao[];
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onRemoverNeoInstalacaoDoCalendario?: (id: string) => void;
  onRemoverNeoCorrecaoDoCalendario?: (id: string) => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento>; fonte?: 'ordens_carregamento' | 'instalacoes' | 'correcoes' }) => Promise<void>;
  onOrdemAdded?: () => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
  onOpenNeoInstalacaoDetails?: (neoInstalacao: NeoInstalacao) => void;
  onOpenNeoCorrecaoDetails?: (neoCorrecao: NeoCorrecao) => void;
  onExcluirNeoInstalacao?: (id: string) => void;
  onExcluirNeoCorrecao?: (id: string) => void;
}

export const DiaCardExpedicao = ({
  date,
  ordens,
  neoInstalacoes = [],
  neoCorrecoes = [],
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onRemoverNeoInstalacaoDoCalendario,
  onRemoverNeoCorrecaoDoCalendario,
  onUpdateOrdem,
  onOrdemAdded,
  onOrdemClick,
  onOpenNeoInstalacaoDetails,
  onOpenNeoCorrecaoDetails,
  onExcluirNeoInstalacao,
  onExcluirNeoCorrecao,
}: DiaCardExpedicaoProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const hoje = new Date();
  const isToday = isSameDay(date, hoje);
  const isWeekendDay = isWeekend(date);

  const ordensNoDia = ordens.filter((ordem) => {
    if (!ordem.data_carregamento) return false;
    return isSameDay(new Date(ordem.data_carregamento), date);
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
        status: params.fonte === 'instalacoes' ? 'pronta_fabrica' : 'agendada'
      },
      fonte: params.fonte || 'ordens_carregamento'
    });

    onOrdemAdded?.();
  };

  const totalCards = ordensNoDia.length + neoNoDia.length + neoCorrecoesNoDia.length;

  return (
    <>
      <Card
        className={`p-3 h-full min-h-[180px] flex flex-col transition-colors ${
          isToday
            ? "border-primary bg-primary/5"
            : isWeekendDay
            ? "bg-muted/30"
            : ""
        }`}
      >
        {/* Cabeçalho do dia */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div>
            <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {format(date, "EEE", { locale: ptBR })}
            </p>
            <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
              {format(date, "dd", { locale: ptBR })}
            </p>
          </div>

          {onUpdateOrdem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Lista de ordens */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {totalCards === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Nenhuma ordem
            </div>
          ) : (
            <>
              {visibleOrdens.map((ordem) => (
                <OrdemCarregamentoCard
                  key={ordem.id}
                  ordem={ordem}
                  onClick={onOrdemClick}
                  onEdit={onEdit}
                  onRemoverDoCalendario={onRemoverDoCalendario}
                />
              ))}
              {visibleNeo.map((neo) => (
                <NeoInstalacaoCard key={neo.id} neoInstalacao={neo} onOpenDetails={onOpenNeoInstalacaoDetails} onExcluir={onExcluirNeoInstalacao} onRemover={onRemoverNeoInstalacaoDoCalendario} />
              ))}
              {visibleNeoCorrecoes.map((neo) => (
                <NeoCorrecaoCard key={neo.id} neoCorrecao={neo} onOpenDetails={onOpenNeoCorrecaoDetails} onExcluir={onExcluirNeoCorrecao} onRemover={onRemoverNeoCorrecaoDoCalendario} />
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
                onOrdemClick={onOrdemClick}
                onOpenNeoInstalacaoDetails={onOpenNeoInstalacaoDetails}
                onOpenNeoCorrecaoDetails={onOpenNeoCorrecaoDetails}
                onExcluirNeoInstalacao={onExcluirNeoInstalacao}
                onExcluirNeoCorrecao={onExcluirNeoCorrecao}
                onRemoverNeoInstalacaoDoCalendario={onRemoverNeoInstalacaoDoCalendario}
                onRemoverNeoCorrecaoDoCalendario={onRemoverNeoCorrecaoDoCalendario}
              />
            </>
          )}
        </div>
      </Card>

      <AdicionarOrdemCalendarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dataSelecionada={date}
        onConfirm={handleConfirmModal}
      />
    </>
  );
};
