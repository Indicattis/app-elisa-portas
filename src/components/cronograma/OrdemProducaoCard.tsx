import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, User, Pause } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrdemProducaoSimples, TipoOrdemProducao } from "@/hooks/useOrdensProducaoPrioridade";

interface OrdemProducaoCardProps {
  ordem: OrdemProducaoSimples;
  posicao: number;
  tipo: TipoOrdemProducao;
  onOrdemClick: (ordem: OrdemProducaoSimples) => void;
}

export function OrdemProducaoCard({ ordem, posicao, tipo, onOrdemClick }: OrdemProducaoCardProps) {
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
      return { label: 'P', variant: 'outline' as const, className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    switch (status) {
      case 'pendente':
        return { label: 'Disp', variant: 'outline' as const, className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'em_andamento':
        return { label: 'And', variant: 'outline' as const, className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: status?.substring(0, 3), variant: 'outline' as const, className: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };
    }
  };

  const statusConfig = getStatusConfig(ordem.status, ordem.pausada);
  
  // Metragem: preferir m² se existir, senão m linear
  const metragem = ordem.metragem_quadrada && ordem.metragem_quadrada > 0 
    ? `${ordem.metragem_quadrada.toFixed(0)}m²` 
    : ordem.metragem_linear && ordem.metragem_linear > 0 
      ? `${ordem.metragem_linear.toFixed(0)}m`
      : null;

  const handleClick = (e: React.MouseEvent) => {
    // Não propagar clique se estiver arrastando
    if (isDragging) return;
    onOrdemClick(ordem);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "h-[45px] bg-zinc-800/50 rounded-md border border-zinc-700/50 px-2",
        "flex items-center gap-2 cursor-pointer",
        "hover:bg-zinc-800 hover:border-zinc-600/50 transition-all",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-0.5 rounded hover:bg-zinc-700/50 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Posição */}
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold flex-shrink-0">
        {posicao}
      </span>

      {/* Número ordem (truncado) */}
      <span className="text-xs font-medium text-white w-[72px] truncate flex-shrink-0">
        {ordem.numero_ordem}
      </span>

      {/* Cliente (truncado) */}
      <span className="text-[10px] text-zinc-400 w-[70px] truncate flex-shrink-0 hidden sm:block">
        {ordem.cliente_nome}
      </span>

      {/* Cores (max 2) */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {ordem.cores && ordem.cores.length > 0 ? (
          <>
            {ordem.cores.slice(0, 2).map((cor, i) => (
              <div 
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: cor.codigo_hex }}
                title={cor.nome}
              />
            ))}
            {ordem.cores.length > 2 && (
              <span className="text-[9px] text-zinc-500">+{ordem.cores.length - 2}</span>
            )}
          </>
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-600" />
        )}
      </div>

      {/* Metragem */}
      {metragem && (
        <span className="text-[10px] text-zinc-400 w-[36px] text-right flex-shrink-0">
          {metragem}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Status - ícone de pausa ou badge compacto */}
      {ordem.pausada ? (
        <Pause className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
      ) : (
        <Badge variant={statusConfig.variant} className={cn("text-[9px] px-1.5 py-0 h-4 flex-shrink-0", statusConfig.className)}>
          {statusConfig.label}
        </Badge>
      )}

      {/* Avatar responsável */}
      {ordem.responsavel_nome ? (
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarFallback className="text-[8px] bg-zinc-700 text-zinc-300">
            {ordem.responsavel_nome.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0">
          <User className="h-2.5 w-2.5 text-zinc-500" />
        </div>
      )}
    </div>
  );
}
