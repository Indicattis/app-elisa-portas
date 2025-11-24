import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreVertical, Pencil, XCircle, Package, MapPin, Info } from "lucide-react";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

interface OrdemCarregamentoCardProps {
  ordem: OrdemCarregamento;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onClick?: (ordem: OrdemCarregamento) => void;
}

export const OrdemCarregamentoCard = ({
  ordem,
  onEdit,
  onRemoverDoCalendario,
  onClick,
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

  return (
    <Card 
      className={`relative h-[35px] p-2 border transition-all duration-200 cursor-pointer ${getStatusColor(ordem.status)}`}
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

        <div className="flex items-center gap-1 shrink-0">
          {ordem.venda && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-0.5 hover:bg-accent rounded-md transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="space-y-2">
                    <div className="font-semibold text-xs border-b border-border pb-1">
                      Pedido: {ordem.pedido?.numero_pedido || 'N/A'}
                    </div>
                    
                    {ordem.venda.cidade && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{ordem.venda.cidade}/{ordem.venda.estado}</span>
                      </div>
                    )}

                    {ordem.venda.data_prevista_entrega && (
                      <div className="text-xs text-muted-foreground">
                        Entrega prevista: {new Date(ordem.venda.data_prevista_entrega).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    {ordem.venda.produtos && ordem.venda.produtos.length > 0 && (
                      <div className="pt-1 border-t border-border/50">
                        <p className="text-[10px] font-medium mb-1.5">Produtos:</p>
                        <div className="space-y-1">
                          {ordem.venda.produtos.map((produto, idx) => (
                            produto.cor && (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                <div 
                                  className="h-2.5 w-2.5 rounded-full border border-border/30 shrink-0" 
                                  style={{ backgroundColor: produto.cor.codigo_hex }}
                                />
                                <span>{produto.cor.nome}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-0.5 hover:bg-accent rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
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
      </div>

    </Card>
  );
};
