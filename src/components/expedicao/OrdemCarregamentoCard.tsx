import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, XCircle, Package, MapPin } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

interface OrdemCarregamentoCardProps {
  ordem: OrdemCarregamento;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
}

export const OrdemCarregamentoCard = ({
  ordem,
  onEdit,
  onRemoverDoCalendario,
}: OrdemCarregamentoCardProps) => {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'agendada':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'em_carregamento':
        return 'bg-purple-500/10 border-purple-500/30';
      case 'concluida':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'agendada': return 'Agendada';
      case 'em_carregamento': return 'Em Carregamento';
      case 'concluida': return 'Concluída';
      default: return 'Desconhecido';
    }
  };

  return (
    <Card className={`p-3 border transition-colors hover:border-primary/50 ${getStatusColor(ordem.status)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{ordem.nome_cliente}</h4>
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Autorizado'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{ordem.pedido?.numero_pedido || 'N/A'}</span>
          </div>

          {ordem.venda && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {ordem.venda.cidade}/{ordem.venda.estado}
              </span>
            </div>
          )}

          {ordem.hora && (
            <div className="text-xs text-muted-foreground">
              {ordem.hora}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-accent rounded-md transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(ordem)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRemoverDoCalendario(ordem.id)}
              className="text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Remover do Calendário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};
