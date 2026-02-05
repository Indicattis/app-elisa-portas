import { Truck, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface PedidoSidebarItemProps {
  pedido: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    prioridade_etapa: number;
    tipo_entrega?: 'entrega' | 'instalacao' | 'manutencao' | 'servico' | 'correcao';
  };
  posicao: number;
  isSelected: boolean;
  onClick: () => void;
}

const TIPO_ENTREGA_ICON: Record<string, React.ReactNode> = {
  entrega: <Package className="h-3 w-3 text-emerald-400" />,
  instalacao: <Truck className="h-3 w-3 text-blue-400" />,
  manutencao: <Wrench className="h-3 w-3 text-orange-400" />,
  servico: <Wrench className="h-3 w-3 text-purple-400" />,
  correcao: <Wrench className="h-3 w-3 text-red-400" />,
};

export function PedidoSidebarItem({ 
  pedido, 
  posicao, 
  isSelected, 
  onClick 
}: PedidoSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-[45px] px-2 rounded-md border transition-all",
        "flex items-center gap-2 text-left",
        isSelected 
          ? "bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30" 
          : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600/50"
      )}
    >
      {/* Posição */}
      <span className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0",
        isSelected ? "bg-cyan-500/30 text-cyan-200" : "bg-zinc-700/50 text-zinc-400"
      )}>
        {posicao}
      </span>

      {/* Número do pedido */}
      <span className={cn(
        "text-[10px] font-medium flex-shrink-0",
        isSelected ? "text-cyan-200" : "text-zinc-400"
      )}>
        {pedido.numero_pedido}
      </span>

      {/* Cliente (truncado) */}
      <span className={cn(
        "text-xs truncate flex-1 min-w-0",
        isSelected ? "text-white" : "text-zinc-300"
      )}>
        {pedido.cliente_nome}
      </span>

      {/* Ícone tipo entrega */}
      {pedido.tipo_entrega && TIPO_ENTREGA_ICON[pedido.tipo_entrega] && (
        <div className="flex-shrink-0">
          {TIPO_ENTREGA_ICON[pedido.tipo_entrega]}
        </div>
      )}
    </button>
  );
}
