import { NeoCorrecao } from "@/types/neoCorrecao";
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
import { MoreVertical, MapPin, Info, XCircle, CheckCircle, AlertTriangle, Trash2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoCardProps {
  neoCorrecao: NeoCorrecao;
  onClick?: (neoCorrecao: NeoCorrecao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  onExcluir?: (id: string) => void;
  onEditar?: (neoCorrecao: NeoCorrecao) => void;
  onOpenDetails?: (neoCorrecao: NeoCorrecao) => void;
  dragListeners?: any;
}

export const NeoCorrecaoCard = ({
  neoCorrecao,
  onClick,
  onConcluir,
  onRemover,
  onExcluir,
  onEditar,
  onOpenDetails,
  dragListeners,
}: NeoCorrecaoCardProps) => {
  // Cor do responsável
  const getResponsavelCor = () => {
    if (neoCorrecao.tipo_responsavel === 'autorizado') {
      return '#10B981'; // Verde para autorizados
    }
    return neoCorrecao.equipe?.cor || '#9333ea';
  };

  // Nome do responsável (equipe ou autorizado)
  const getResponsavelNome = () => {
    if (neoCorrecao.tipo_responsavel === 'autorizado') {
      return neoCorrecao.autorizado_nome || 'Sem autorizado';
    }
    return neoCorrecao.equipe_nome || 'Sem equipe';
  };

  const corResponsavel = getResponsavelCor();

  // Estilo roxo para correções
  const getCardStyles = () => {
    return {
      backgroundColor: 'rgb(147 51 234 / 0.15)',
      borderColor: 'rgb(147 51 234 / 0.5)',
    };
  };

  return (
    <Card 
      className="relative h-[35px] p-2 border transition-all duration-200 cursor-pointer hover:opacity-80"
      style={getCardStyles()}
      onClick={() => onClick?.(neoCorrecao)}
    >
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing" {...dragListeners}>
          <h4 className="font-semibold text-xs truncate text-purple-200">{neoCorrecao.nome_cliente}</h4>
          <Badge 
            variant="secondary" 
            className="text-[9px] px-1 py-0 h-4 shrink-0"
            style={{ 
              backgroundColor: `${corResponsavel}30`,
              color: corResponsavel,
              borderColor: `${corResponsavel}50`
            }}
          >
            {getResponsavelNome()}
          </Badge>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(onConcluir || onRemover || onExcluir || onEditar) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onEditar && (
                  <DropdownMenuItem 
                    onClick={() => onEditar(neoCorrecao)}
                    className="text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onConcluir && (
                  <DropdownMenuItem 
                    onClick={() => onConcluir(neoCorrecao.id)}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                    Concluir
                  </DropdownMenuItem>
                )}
                {onRemover && (
                  <DropdownMenuItem 
                    onClick={() => onRemover(neoCorrecao.id)}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-2" />
                    Remover do calendário
                  </DropdownMenuItem>
                )}
                {onExcluir && (
                  <DropdownMenuItem 
                    onClick={() => onExcluir(neoCorrecao.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Excluir
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails?.(neoCorrecao);
                  }}
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="space-y-2">
                  <div className="font-semibold text-[11px] border-b border-border pb-1">
                    {neoCorrecao.nome_cliente}
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    <AlertTriangle className="h-3 w-3 text-purple-400" />
                    <span className="font-medium text-purple-400">Correção Avulsa</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {getResponsavelNome()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{neoCorrecao.cidade}/{neoCorrecao.estado}</span>
                  </div>

                  {neoCorrecao.data_correcao && (
                    <div className="text-[10px] text-muted-foreground">
                      Data: {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yyyy", { locale: ptBR })}
                      {neoCorrecao.hora && ` às ${neoCorrecao.hora.substring(0, 5)}`}
                    </div>
                  )}

                  {neoCorrecao.descricao && (
                    <div className="pt-1 border-t border-border/50">
                      <p className="text-[9px] font-medium mb-1">Descrição:</p>
                      <p className="text-[9px] text-muted-foreground">{neoCorrecao.descricao}</p>
                    </div>
                  )}
                  
                  <p className="text-[9px] text-muted-foreground/70 italic pt-1">
                    Clique no ícone ℹ️ para ver detalhes completos
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};
