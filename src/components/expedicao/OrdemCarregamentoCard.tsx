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

  return (
    <Card className={`group relative h-[35px] hover:h-auto p-2 border transition-all duration-300 hover:border-primary/50 hover:shadow-md overflow-hidden hover:overflow-visible ${getStatusColor(ordem.status)}`}>
      {/* Header - Sempre visível */}
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">{ordem.nome_cliente}</h4>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
            {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Entrega'}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-0.5 hover:bg-accent rounded-md transition-colors shrink-0">
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

      {/* Conteúdo expandido - Visível apenas no hover */}
      <div className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-[500px] transition-all duration-300 mt-0 group-hover:mt-2 space-y-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">Pedido: {ordem.pedido?.numero_pedido || 'N/A'}</span>
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
            Horário: {ordem.hora}
          </div>
        )}

        {ordem.venda?.produtos && ordem.venda.produtos.length > 0 && (
          <div className="pt-1 border-t border-border/50">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Produtos:</p>
            <div className="space-y-1">
              {ordem.venda.produtos.slice(0, 3).map((produto, idx) => (
                produto.cor && (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                    <div 
                      className="h-2 w-2 rounded-full border border-border/30 shrink-0" 
                      style={{ backgroundColor: produto.cor.codigo_hex }}
                    />
                    <span className="text-muted-foreground truncate">{produto.cor.nome}</span>
                  </div>
                )
              ))}
              {ordem.venda.produtos.length > 3 && (
                <p className="text-[10px] text-muted-foreground/70">
                  +{ordem.venda.produtos.length - 3} mais
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
