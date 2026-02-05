import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrdemProducaoCard } from "./OrdemProducaoCard";
import type { OrdemProducaoSimples, TipoOrdemProducao } from "@/hooks/useOrdensProducaoPrioridade";
import { cn } from "@/lib/utils";

interface ColunaOrdensProducaoProps {
  tipo: TipoOrdemProducao;
  titulo: string;
  ordens: OrdemProducaoSimples[];
  isLoading: boolean;
  cor: string;
  onOrdemClick: (ordem: OrdemProducaoSimples) => void;
  isDragDisabled?: boolean;
}

const CORES_MAP: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
};

export function ColunaOrdensProducao({ tipo, titulo, ordens, isLoading, cor, onOrdemClick, isDragDisabled = false }: ColunaOrdensProducaoProps) {
  const { setNodeRef, isOver } = useDroppable({ id: tipo });
  const cores = CORES_MAP[cor] || CORES_MAP.blue;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-w-[280px] max-w-[320px] rounded-xl border backdrop-blur-sm",
        cores.bg,
        cores.border,
        isOver && "ring-2 ring-blue-500/50"
      )}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 border-b", cores.border)}>
        <div className="flex items-center justify-between">
          <h3 className={cn("font-semibold text-sm", cores.text)}>
            {titulo}
          </h3>
          <span className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-full">
            {ordens.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : ordens.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-zinc-500">Nenhuma ordem</p>
          </div>
        ) : isDragDisabled ? (
          <div className="flex flex-col gap-1.5">
            {ordens.map((ordem, index) => (
              <OrdemProducaoCard 
                key={ordem.id} 
                ordem={ordem} 
                posicao={index + 1}
                tipo={tipo}
                onOrdemClick={onOrdemClick}
                isDragDisabled
              />
            ))}
          </div>
        ) : (
          <SortableContext items={ordens.map(o => o.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {ordens.map((ordem, index) => (
                <OrdemProducaoCard 
                  key={ordem.id} 
                  ordem={ordem} 
                  posicao={index + 1}
                  tipo={tipo}
                  onOrdemClick={onOrdemClick}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </ScrollArea>
    </div>
  );
}
