import { useDraggable } from '@dnd-kit/core';
import { Phone, MapPin, Calendar, User } from 'lucide-react';

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

interface LeadKanbanCardProps {
  lead: Lead;
  atendenteName: string | null;
  isDragOverlay?: boolean;
}

export function LeadKanbanCard({ lead, atendenteName, isDragOverlay }: LeadKanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className={`p-3 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 cursor-grab active:cursor-grabbing
                  hover:bg-white/10 transition-all duration-200 touch-none select-none
                  ${isDragging && !isDragOverlay ? 'opacity-30' : ''}
                  ${isDragOverlay ? 'shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/40 scale-105' : ''}`}
    >
      <p className="text-white font-medium text-sm truncate">{lead.nome}</p>

      <div className="flex flex-col gap-1 mt-1.5 text-xs text-white/50">
        <span className="flex items-center gap-1 truncate">
          <Phone className="w-3 h-3 shrink-0" />
          {lead.telefone}
        </span>
        {lead.cidade && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {lead.cidade}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(lead.data_envio).toLocaleDateString('pt-BR')}
        </span>
        <span className="flex items-center gap-1 truncate">
          <User className="w-3 h-3 shrink-0" />
          {atendenteName || 'Não atribuído'}
        </span>
      </div>

      {lead.valor_orcamento != null && lead.valor_orcamento > 0 && (
        <p className="mt-1.5 text-xs text-blue-400 font-medium">
          R$ {lead.valor_orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      )}
    </div>
  );
}
