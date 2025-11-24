import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

interface OrdemCarregamentoCardProps {
  ordem: OrdemCarregamento;
  onClick?: (ordem: OrdemCarregamento) => void;
}

export const OrdemCarregamentoCard = ({
  ordem,
  onClick,
}: OrdemCarregamentoCardProps) => {
  const getStatusColor = (status: string | null, tipoCarregamento: string | null) => {
    // Cores baseadas no tipo de carregamento
    if (tipoCarregamento === 'elisa') {
      return 'bg-blue-500/10 border-blue-500/30';
    } else if (tipoCarregamento === 'autorizados') {
      return 'bg-purple-500/10 border-purple-500/30';
    }
    
    // Fallback para cores de status
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'concluida':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Card 
      className={`relative h-[35px] p-2 border transition-all duration-200 cursor-pointer ${getStatusColor(ordem.status, ordem.tipo_carregamento)}`}
      onClick={() => onClick?.(ordem)}
    >
      {/* Header - Sempre visível */}
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">{ordem.nome_cliente}</h4>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
            {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Entrega'}
          </Badge>
        </div>

        <button 
          className="p-0.5 hover:bg-accent rounded-md transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(ordem);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>

    </Card>
  );
};
