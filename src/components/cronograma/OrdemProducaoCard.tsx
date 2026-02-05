import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, User, Pause } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { OrdemProducaoSimples, TipoOrdemProducao } from "@/hooks/useOrdensProducaoPrioridade";

interface OrdemProducaoCardProps {
  ordem: OrdemProducaoSimples;
  posicao: number;
  tipo: TipoOrdemProducao;
  onOrdemClick: (ordem: OrdemProducaoSimples) => void;
  isDragDisabled?: boolean;
}

export function OrdemProducaoCard({ ordem, posicao, tipo, onOrdemClick, isDragDisabled = false }: OrdemProducaoCardProps) {
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

  // Determinar estilo do card baseado no status
  const getCardStyle = () => {
    if (ordem.pausada) {
      return "bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 hover:border-amber-500/50";
    }
    if (ordem.status === 'pendente') {
      return "bg-blue-500/15 border-blue-500/40 hover:bg-blue-500/25 hover:border-blue-500/50";
    }
    return "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600/50";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "h-[45px] rounded-md border px-2",
        "flex items-center gap-2 cursor-pointer transition-all",
        getCardStyle(),
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      {/* Drag Handle - hidden when disabled */}
      {!isDragDisabled && (
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Posição */}
      <span className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0",
        ordem.pausada ? "bg-amber-500/30 text-amber-200" : "bg-blue-500/30 text-blue-200"
      )}>
        {posicao}
      </span>

      {/* Cliente (truncado) - substituiu o número da ordem */}
      <span className={cn(
        "text-xs font-medium truncate flex-1 min-w-0",
        ordem.pausada ? "text-amber-100" : ordem.status === 'pendente' ? "text-blue-100" : "text-white"
      )}>
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
              <span className="text-[9px] text-zinc-400">+{ordem.cores.length - 2}</span>
            )}
          </>
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-600" />
        )}
      </div>

      {/* Metragem */}
      {metragem && (
        <span className="text-[10px] text-zinc-300 w-[36px] text-right flex-shrink-0">
          {metragem}
        </span>
      )}

      {/* Ícone de pausa se pausada */}
      {ordem.pausada && (
        <Pause className="h-3.5 w-3.5 text-amber-300 flex-shrink-0" />
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
