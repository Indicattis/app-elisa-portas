import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PedidoComOrdens, OrdemStatus, TipoOrdem } from "@/hooks/useOrdensPorPedido";

interface PedidoOrdemCardProps {
  pedido: PedidoComOrdens;
  onOrdemClick: (ordem: OrdemStatus) => void;
}

const ORDEM_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};

const getStatusStyle = (status: string | null) => {
  switch (status) {
    case 'pendente':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30';
    case 'em_andamento':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30';
    case 'concluido':
      return 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30';
    default:
      return 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30';
  }
};

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case 'pendente':
      return 'Pendente';
    case 'em_andamento':
      return 'Em andamento';
    case 'concluido':
      return 'Concluído';
    default:
      return 'N/A';
  }
};

export function PedidoOrdemCard({ pedido, onOrdemClick }: PedidoOrdemCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ordens: OrdemStatus[] = [
    pedido.ordens.soldagem,
    pedido.ordens.perfiladeira,
    pedido.ordens.separacao,
    pedido.ordens.qualidade,
    pedido.ordens.pintura,
  ];

  const ordensExistentes = ordens.filter(o => o.existe);
  const ordensConcluidas = ordensExistentes.filter(o => o.status === 'concluido');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <CollapsibleTrigger asChild>
          <button
            className="w-full rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-4 
                       hover:bg-zinc-800/50 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      Pedido #{pedido.numero_pedido}
                    </span>
                    {ordensExistentes.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400">
                        {ordensConcluidas.length}/{ordensExistentes.length} ordens
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-400">
                    {pedido.cliente_nome}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ordens.map((ordem) => (
                <button
                  key={ordem.tipo}
                  onClick={() => ordem.existe && onOrdemClick(ordem)}
                  disabled={!ordem.existe}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    "flex flex-col items-start gap-0.5",
                    ordem.existe ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                    getStatusStyle(ordem.status)
                  )}
                >
                  <span className="font-medium">{ORDEM_LABELS[ordem.tipo]}</span>
                  <span className="text-xs opacity-80">
                    {ordem.existe ? getStatusLabel(ordem.status) : 'Sem ordem'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
