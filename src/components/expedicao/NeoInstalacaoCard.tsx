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
import { MoreVertical, MapPin, Calendar, Clock, Trash2, CheckCircle } from "lucide-react";
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="p-2 cursor-pointer hover:shadow-md transition-all border-l-4 group"
            style={{ borderLeftColor: corEquipe }}
            onClick={() => onClick?.(neoInstalacao)}
            {...dragListeners}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Avulso
                  </Badge>
                  <span className="font-medium text-sm truncate">
                    {neoInstalacao.nome_cliente}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-1.5 py-0"
                    style={{ 
                      backgroundColor: `${corEquipe}20`,
                      color: corEquipe,
                      borderColor: corEquipe
                    }}
                  >
                    {neoInstalacao.equipe_nome || "Sem equipe"}
                  </Badge>
                </div>
              </div>

              {(onConcluir || onRemover) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onConcluir && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onConcluir(neoInstalacao.id);
                        }}
                        className="text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir
                      </DropdownMenuItem>
                    )}
                    {onRemover && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemover(neoInstalacao.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{neoInstalacao.nome_cliente}</div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3" />
              <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
            </div>

            {neoInstalacao.data_instalacao && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}

            {neoInstalacao.hora && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                <span>{neoInstalacao.hora.substring(0, 5)}</span>
              </div>
            )}

            {neoInstalacao.descricao && (
              <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
                {neoInstalacao.descricao}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
