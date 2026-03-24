import { useDraggable } from '@dnd-kit/core';
import { Phone, MapPin, Calendar, User, UserCheck, MessageCircle, Clock } from 'lucide-react';
import { handleWhatsAppClick } from '@/utils/timeUtils';

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
  userId?: string;
  onCapture?: (leadId: string) => void;
}

function formatTimeAgo(dataEnvio: string): string {
  const seconds = Math.floor((Date.now() - new Date(dataEnvio).getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);

  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    return rest > 0 ? `${weeks}sem ${rest}d` : `${weeks}sem`;
  }
  if (days > 0) return `${days}d ${Math.floor((seconds % 86400) / 3600)}h`;
  if (hours > 0) return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${minutes}m`;
}

function getTimeColor(dataEnvio: string): { bg: string; text: string } {
  const days = (Date.now() - new Date(dataEnvio).getTime()) / 86400000;
  if (days < 3) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  if (days < 7) return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
  return { bg: 'bg-red-500/20', text: 'text-red-400' };
}

export function LeadKanbanCard({ lead, atendenteName, isDragOverlay, userId, onCapture }: LeadKanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const timeColor = getTimeColor(lead.data_envio);

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className={`p-3 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 cursor-grab active:cursor-grabbing
                  hover:bg-white/10 transition-all duration-200 touch-none select-none
                  ${isDragging && !isDragOverlay ? 'opacity-30' : ''}
                  ${isDragOverlay ? 'shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/40 scale-105' : ''}`}
    >
      {/* Header: nome + badge tempo */}
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-white font-medium text-sm truncate flex-1">{lead.nome}</p>
        <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${timeColor.bg} ${timeColor.text}`}>
          <Clock className="w-2.5 h-2.5" />
          {formatTimeAgo(lead.data_envio)}
        </span>
      </div>

      {/* Info */}
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

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-2">
        {!lead.atendente_id && onCapture && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onCapture(lead.id); }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-md
                       bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <UserCheck className="w-3 h-3" />
            Capturar
          </button>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); handleWhatsAppClick(lead.telefone, lead.nome); }}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-md
                     bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
