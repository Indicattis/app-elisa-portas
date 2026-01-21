import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreVertical, MapPin, Info, Edit, XCircle, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NeoInstalacao } from "@/types/neoInstalacao";

interface NeoInstalacaoCardProps {
  neoInstalacao: NeoInstalacao;
  onClick?: (neoInstalacao: NeoInstalacao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  dragListeners?: any;
}

export const NeoInstalacaoCard = ({
  neoInstalacao,
  onClick,
  onConcluir,
  onRemover,
  dragListeners,
}: NeoInstalacaoCardProps) => {
  const corEquipe = neoInstalacao.equipe?.cor || "#6366f1";

  // Estilo igual ao de instalação Elisa (Azul)
  const getCardStyles = () => {
    return {
      backgroundColor: 'rgb(59 130 246 / 0.15)',
      borderColor: 'rgb(59 130 246 / 0.5)',
    };
  };

  // Nome do responsável (equipe)
  const getResponsavelNome = () => {
    return neoInstalacao.equipe_nome || 'Sem equipe';
  };

  return (
    <Card 
      className="relative h-[35px] p-2 border transition-all duration-200 cursor-pointer hover:opacity-80"
      style={getCardStyles()}
      onClick={() => onClick?.(neoInstalacao)}
    >
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing" {...dragListeners}>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1 py-0 h-4 shrink-0 bg-purple-500/20 text-purple-300 border-purple-400/50"
          >
            Avulso
          </Badge>
          <h4 className="font-semibold text-xs truncate">{neoInstalacao.nome_cliente}</h4>
          <Badge 
            variant="secondary" 
            className="text-[9px] px-1 py-0 h-4 shrink-0"
            style={{ 
              backgroundColor: `${corEquipe}30`,
              color: corEquipe,
              borderColor: `${corEquipe}50`
            }}
          >
            {getResponsavelNome()}
          </Badge>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(onConcluir || onRemover) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onConcluir && (
                  <DropdownMenuItem 
                    onClick={() => onConcluir(neoInstalacao.id)}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                    Concluir
                  </DropdownMenuItem>
                )}
                {onRemover && (
                  <DropdownMenuItem 
                    onClick={() => onRemover(neoInstalacao.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-2" />
                    Remover do calendário
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
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
                    {neoInstalacao.nome_cliente}
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="font-medium text-purple-400">Instalação Avulsa</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {getResponsavelNome()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
                  </div>

                  {neoInstalacao.data_instalacao && (
                    <div className="text-[10px] text-muted-foreground">
                      Data: {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                      {neoInstalacao.hora && ` às ${neoInstalacao.hora.substring(0, 5)}`}
                    </div>
                  )}

                  {neoInstalacao.descricao && (
                    <div className="pt-1 border-t border-border/50">
                      <p className="text-[9px] font-medium mb-1">Descrição:</p>
                      <p className="text-[9px] text-muted-foreground">{neoInstalacao.descricao}</p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};
