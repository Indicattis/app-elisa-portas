import { useState } from "react";
import { format, isSameDay, isWeekend, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";
import { NeoInstalacaoCard } from "./NeoInstalacaoCard";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";

interface DiaCardExpedicaoProps {
  date: Date;
  ordens: OrdemCarregamento[];
  neoInstalacoes?: NeoInstalacao[];
  onDayClick: (date: Date) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemAdded?: () => void;
  onOrdemClick?: (ordem: OrdemCarregamento) => void;
}

export const DiaCardExpedicao = ({
  date,
  ordens,
  neoInstalacoes = [],
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
  onUpdateOrdem,
  onOrdemAdded,
  onOrdemClick,
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

    onOrdemAdded?.();
  };

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
          {ordensNoDia.length === 0 && neoNoDia.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Nenhuma ordem
            </div>
          ) : (
            <>
              {ordensNoDia.map((ordem) => (
                <OrdemCarregamentoCard
                  key={ordem.id}
                  ordem={ordem}
                  onClick={onOrdemClick}
                  onEdit={onEdit}
                  onRemoverDoCalendario={onRemoverDoCalendario}
                />
              ))}
              {neoNoDia.map((neo) => (
                <NeoInstalacaoCard key={neo.id} neoInstalacao={neo} />
              ))}
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
