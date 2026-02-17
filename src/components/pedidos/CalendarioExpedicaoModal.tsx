import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";
import { startOfWeek, startOfMonth } from "date-fns";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { useNeoInstalacoes } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoes } from "@/hooks/useNeoCorrecoes";
import { useCorrecoes } from "@/hooks/useCorrecoes";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { NeoCorrecao } from "@/types/neoCorrecao";

interface CalendarioExpedicaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarioExpedicaoModal = ({ open, onOpenChange }: CalendarioExpedicaoModalProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('month');
  const [legendaFiltro, setLegendaFiltro] = useState<string | null>(null);

  const { ordens } = useOrdensCarregamentoCalendario(currentDate, viewType);
  const { neoInstalacoes } = useNeoInstalacoes(currentDate, viewType);
  const { neoCorrecoes } = useNeoCorrecoes(currentDate, viewType);
  const { correcoes: correcoesPedido } = useCorrecoes(currentDate, viewType);

  // Mapear correções de pedido para formato NeoCorrecao
  const correcoesPedidoAsNeoCorrecao: NeoCorrecao[] = (correcoesPedido || []).map(c => ({
    id: c.id,
    nome_cliente: c.nome_cliente,
    cidade: c.cidade,
    estado: c.estado,
    data_correcao: c.data_correcao,
    hora: c.hora,
    descricao: c.observacoes || `Correção de pedido${c.pedido?.numero_pedido ? ` #${c.pedido.numero_pedido}` : ''}`,
    equipe_id: null,
    equipe_nome: c.responsavel_correcao_nome,
    tipo_responsavel: null,
    autorizado_id: null,
    autorizado_nome: null,
    valor_total: 0,
    valor_a_receber: 0,
    status: c.status,
    concluida: c.concluida,
    concluida_em: c.concluida_em,
    concluida_por: c.concluida_por,
    created_by: c.created_by,
    created_at: c.created_at,
    updated_at: c.updated_at,
    vezes_agendado: c.vezes_agendado,
    etapa_causadora: null,
    prioridade_gestao: 0,
    _tipo: 'neo_correcao' as const,
  }));

  const todasCorrecoes = [...(neoCorrecoes || []), ...correcoesPedidoAsNeoCorrecao];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Calendário de Expedição</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Semana
              </Button>
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Mês
              </Button>
            </div>
          </div>
        </DialogHeader>

        {viewType === 'month' ? (
          <CalendarioMensalExpedicaoDesktop
            currentMonth={currentDate}
            ordens={ordens}
            neoInstalacoes={neoInstalacoes}
            neoCorrecoes={todasCorrecoes}
            onMonthChange={setCurrentDate}
            activeLegend={legendaFiltro}
            onLegendToggle={(legend) => setLegendaFiltro(legendaFiltro === legend ? null : legend)}
            readOnly
          />
        ) : (
          <CalendarioSemanalExpedicaoDesktop
            startDate={weekStart}
            ordens={ordens}
            neoInstalacoes={neoInstalacoes}
            neoCorrecoes={todasCorrecoes}
            onPreviousWeek={() => setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))}
            onNextWeek={() => setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))}
            onToday={() => setCurrentDate(new Date())}
            activeLegend={legendaFiltro}
            onLegendToggle={(legend) => setLegendaFiltro(legendaFiltro === legend ? null : legend)}
            readOnly
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
