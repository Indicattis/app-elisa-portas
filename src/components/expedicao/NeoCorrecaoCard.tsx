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
import { MoreVertical, Check, Trash2, Info, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoCardProps {
  neoCorrecao: NeoCorrecao;
  onClick?: (neoCorrecao: NeoCorrecao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  dragListeners?: any;
}

export const NeoCorrecaoCard = ({
  neoCorrecao,
  onClick,
  onConcluir,
  onRemover,
  dragListeners,
}: NeoCorrecaoCardProps) => {
  const corEquipe = neoCorrecao.equipe?.cor || "#9333ea"; // purple-600 como fallback

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="p-2 cursor-pointer hover:shadow-md transition-shadow border-l-4"
            style={{
              borderLeftColor: "#9333ea",
              backgroundColor: "rgba(147, 51, 234, 0.1)",
            }}
            onClick={() => onClick?.(neoCorrecao)}
            {...dragListeners}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3 w-3 text-purple-600 flex-shrink-0" />
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Correção
                  </Badge>
                </div>
                <p className="text-xs font-medium truncate">
                  {neoCorrecao.nome_cliente}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    style={{
                      backgroundColor: `${corEquipe}20`,
                      color: corEquipe,
                      borderColor: `${corEquipe}40`,
                    }}
                  >
                    {neoCorrecao.equipe_nome || "Sem equipe"}
                  </Badge>
                </div>
              </div>

              {(onConcluir || onRemover) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onConcluir && (
                      <DropdownMenuItem onClick={() => onConcluir(neoCorrecao.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Concluir
                      </DropdownMenuItem>
                    )}
                    {onRemover && (
                      <DropdownMenuItem
                        onClick={() => onRemover(neoCorrecao.id)}
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
          <div className="space-y-1 text-xs">
            <p className="font-medium">{neoCorrecao.nome_cliente}</p>
            <p className="text-muted-foreground">
              {neoCorrecao.cidade}/{neoCorrecao.estado}
            </p>
            {neoCorrecao.data_correcao && (
              <p>
                Data:{" "}
                {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
                {neoCorrecao.hora && ` às ${neoCorrecao.hora.slice(0, 5)}`}
              </p>
            )}
            {neoCorrecao.descricao && (
              <p className="text-muted-foreground italic">
                {neoCorrecao.descricao}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
