import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeadKanbanCard } from './LeadKanbanCard';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string | null;
  novo_status: string | null;
  canal_aquisicao: string;
  data_envio: string;
  valor_orcamento: number | null;
  atendente_id: string | null;
}

const columnStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  novo: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  em_atendimento: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-400' },
  orcamento_enviado: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
  venda_realizada: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  perdido: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  orcamento_enviado: 'Orçamento Enviado',
  venda_realizada: 'Venda Realizada',
  perdido: 'Perdido',
};

interface LeadKanbanColumnProps {
  status: string;
  leads: Lead[];
  atendentesMap: Record<string, string>;
}

export function LeadKanbanColumn({ status, leads, atendentesMap }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = columnStyles[status] || columnStyles.novo;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[260px] w-[260px] rounded-xl border transition-all duration-200
                  ${style.border} ${isOver ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : 'bg-white/[0.02]'}`}
    >
      {/* Header */}
      <div className={`p-3 rounded-t-xl ${style.bg} border-b ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className={`text-sm font-semibold ${style.text}`}>
              {statusLabels[status]}
            </span>
          </div>
          <Badge className="bg-white/10 text-white/60 border-white/10 text-[10px] px-1.5">
            {leads.length}
          </Badge>
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-240px)]">
        <div className="flex flex-col gap-2 p-2">
          {leads.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">Nenhum lead</p>
          ) : (
            leads.map(lead => (
              <LeadKanbanCard
                key={lead.id}
                lead={lead}
                atendenteName={lead.atendente_id ? atendentesMap[lead.atendente_id] || '...' : null}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
