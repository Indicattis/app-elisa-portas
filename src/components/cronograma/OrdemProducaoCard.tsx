import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, User, Pause, Ruler, Square } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrdemProducaoSimples } from "@/hooks/useOrdensProducaoPrioridade";

interface OrdemProducaoCardProps {
  ordem: OrdemProducaoSimples;
  posicao: number;
}

export function OrdemProducaoCard({ ordem, posicao }: OrdemProducaoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ordem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusConfig = (status: string, pausada?: boolean) => {
    if (pausada) {
      return { label: 'Pausada', variant: 'outline' as const, className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    switch (status) {
      case 'pendente':
        return { label: 'Disponível', variant: 'outline' as const, className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'em_andamento':
        return { label: 'Em Andamento', variant: 'outline' as const, className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: status, variant: 'outline' as const, className: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };
    }
  };

  const statusConfig = getStatusConfig(ordem.status, ordem.pausada);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-3",
        "hover:bg-zinc-800 hover:border-zinc-600/50 transition-all",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-zinc-700/50 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Position Badge */}
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              {posicao}
            </span>
            
            {/* Order Number */}
            <span className="font-medium text-sm text-white truncate">
              {ordem.numero_ordem}
            </span>

            {/* Paused indicator */}
            {ordem.pausada && (
              <Pause className="h-3 w-3 text-amber-400" />
            )}
          </div>

          {/* Client and Pedido */}
          <p className="text-xs text-zinc-400 truncate mb-1">
            {ordem.cliente_nome} • {ordem.numero_pedido}
          </p>

          {/* Cores e Metragens */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Cores das portas */}
            {ordem.cores && ordem.cores.length > 0 ? (
              <div className="flex items-center gap-1">
                {ordem.cores.slice(0, 4).map((cor, i) => (
                  <div 
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: cor.codigo_hex }}
                    title={cor.nome}
                  />
                ))}
                {ordem.cores.length > 4 && (
                  <span className="text-[10px] text-zinc-400">+{ordem.cores.length - 4}</span>
                )}
              </div>
            ) : (
              <div />
            )}

            {/* Metragens */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              {ordem.metragem_quadrada && ordem.metragem_quadrada > 0 && (
                <span className="flex items-center gap-0.5">
                  <Square className="h-3 w-3" />
                  {ordem.metragem_quadrada.toFixed(1)}m²
                </span>
              )}
              {ordem.metragem_linear && ordem.metragem_linear > 0 && (
                <span className="flex items-center gap-0.5">
                  <Ruler className="h-3 w-3" />
                  {ordem.metragem_linear.toFixed(1)}m
                </span>
              )}
            </div>
          </div>

          {/* Motivo da pausa */}
          {ordem.pausada && ordem.justificativa_pausa && (
            <div className="mb-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] text-amber-300 line-clamp-2">
                {ordem.justificativa_pausa}
              </p>
            </div>
          )}

          {/* Footer: Status + Responsavel */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={statusConfig.variant} className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}>
              {statusConfig.label}
            </Badge>

            {ordem.responsavel_nome ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px] bg-zinc-700 text-zinc-300">
                    {ordem.responsavel_nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-zinc-400 truncate max-w-[60px]">
                  {ordem.responsavel_nome.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-zinc-500">
                <User className="h-3 w-3" />
                <span className="text-[10px]">Livre</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
