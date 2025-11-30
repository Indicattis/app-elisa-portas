import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InstalacaoCronograma } from "@/hooks/useInstalacoesCronograma";

interface PontoInstalacaoProps {
  instalacao: InstalacaoCronograma;
  cor: string;
  onDragStart: (item: { id: string; equipId: string; cidade: string }) => void;
  onDragEnd: () => void;
  onEdit: () => void;
}

export function PontoInstalacao({ 
  instalacao, 
  cor, 
  onDragStart, 
  onDragEnd,
  onEdit 
}: PontoInstalacaoProps) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart({
      id: instalacao.id,
      equipId: instalacao.responsavel_instalacao_id || '',
      cidade: instalacao.venda?.cidade || ''
    });
  };

  // Lógica de cores baseada no tipo de instalação
  const getCardStyles = () => {
    // Instalação com Elisa - Vermelho
    if (instalacao.tipo_instalacao === 'elisa') {
      return {
        backgroundColor: 'rgb(239 68 68 / 0.15)',
        borderColor: 'rgb(239 68 68 / 0.5)',
      };
    }

    // Instalação com Autorizado - Azul
    if (instalacao.tipo_instalacao === 'autorizados') {
      return {
        backgroundColor: 'rgb(59 130 246 / 0.15)',
        borderColor: 'rgb(59 130 246 / 0.5)',
      };
    }

    // Sem responsável definido - Amarelo
    return {
      backgroundColor: 'rgb(234 179 8 / 0.15)',
      borderColor: 'rgb(234 179 8 / 0.5)',
    };
  };

  // Obter nome do responsável
  const getResponsavelNome = () => {
    if (!instalacao.tipo_instalacao) return 'Sem responsável';
    
    if (instalacao.tipo_instalacao === 'elisa') return 'Instalação Elisa';
    return 'Autorizado';
  };

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="relative h-[35px] p-2 border transition-all duration-200 cursor-grab active:cursor-grabbing hover:opacity-80 mb-2"
      style={getCardStyles()}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit();
      }}
    >
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">{instalacao.nome_cliente}</h4>
          <Badge 
            variant="secondary" 
            className="text-[9px] px-1 py-0 h-4 shrink-0"
          >
            {getResponsavelNome()}
          </Badge>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {instalacao.venda && (
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
                    <div className="font-semibold text-[11px] border-b border-border pb-1">
                      {instalacao.venda?.cliente_nome || instalacao.nome_cliente}
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="font-medium">Instalação</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {getResponsavelNome()}
                      </span>
                    </div>
                    
                    {instalacao.venda.cidade && (
                      <div className="text-[10px]">
                        <span>{instalacao.venda.cidade}/{instalacao.venda.estado}</span>
                      </div>
                    )}

                    {instalacao.pedido && (
                      <div className="text-[10px] text-muted-foreground">
                        Pedido: {instalacao.pedido.numero_pedido}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  );
}