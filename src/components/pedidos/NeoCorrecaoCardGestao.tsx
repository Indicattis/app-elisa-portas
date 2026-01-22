import { NeoCorrecao } from "@/types/neoCorrecao";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { MapPin, Calendar, Clock, AlertTriangle, Check, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoCardGestaoProps {
  neoCorrecao: NeoCorrecao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
}

export function NeoCorrecaoCardGestao({
  neoCorrecao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo
}: NeoCorrecaoCardGestaoProps) {
  const corEquipe = neoCorrecao.equipe?.cor || "#9333ea";

  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <Card className="p-2 hover:bg-primary/5 transition-colors border-primary/10 bg-primary/5">
          {/* Grid layout similar ao PedidoCard - 14 colunas */}
          <div className="grid grid-cols-[80px_1fr_120px_80px_100px_80px_100px_1fr_80px] gap-2 items-center text-sm">
            
            {/* Col 1: Badge Avulso */}
            <div className="flex items-center justify-center">
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border-purple-500/30"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Avulso
              </Badge>
            </div>

            {/* Col 2: Nome do cliente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-semibold text-sm truncate text-white">
                  {neoCorrecao.nome_cliente && neoCorrecao.nome_cliente.length > 25 
                    ? `${neoCorrecao.nome_cliente.substring(0, 25)}...` 
                    : neoCorrecao.nome_cliente}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{neoCorrecao.nome_cliente}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 3: Cidade/Estado */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="text-[10px] truncate">
                    {neoCorrecao.cidade}/{neoCorrecao.estado}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{neoCorrecao.cidade}, {neoCorrecao.estado}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 4: Data */}
            <div className="text-center">
              {neoCorrecao.data_correcao ? (
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[9px] font-medium text-purple-400">
                    Agendado
                  </span>
                  <span className="text-xs font-bold text-purple-400">
                    {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yy", { locale: ptBR })}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-destructive">
                  Não agendado
                </span>
              )}
            </div>

            {/* Col 5: Hora */}
            <div className="text-center">
              {neoCorrecao.hora ? (
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium">
                    {neoCorrecao.hora.slice(0, 5)}
                  </span>
                </div>
              ) : (
                <span className="text-[9px] text-muted-foreground/50">—</span>
              )}
            </div>

            {/* Col 6: Tipo - sempre correção */}
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 bg-purple-500/10 text-purple-400 border-purple-500/50">
                <AlertTriangle className="h-2.5 w-2.5" />
              </Badge>
            </div>

            {/* Col 7: Equipe */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-1.5 py-0 h-5"
                    style={{ 
                      backgroundColor: `${corEquipe}20`,
                      color: corEquipe,
                    }}
                  >
                    {neoCorrecao.equipe_nome 
                      ? (neoCorrecao.equipe_nome.length > 12 
                          ? `${neoCorrecao.equipe_nome.substring(0, 12)}...` 
                          : neoCorrecao.equipe_nome)
                      : "Sem equipe"}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{neoCorrecao.equipe_nome || "Sem equipe definida"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 8: Descrição resumida */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground truncate">
                  {neoCorrecao.descricao 
                    ? (neoCorrecao.descricao.length > 40 
                        ? `${neoCorrecao.descricao.substring(0, 40)}...` 
                        : neoCorrecao.descricao)
                    : "—"}
                </span>
              </TooltipTrigger>
              {neoCorrecao.descricao && (
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{neoCorrecao.descricao}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Col 9: Ação */}
            <div className="flex items-center justify-end">
              {onConcluir && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-[20px] w-[20px] rounded-[3px] bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConcluir(neoCorrecao.id);
                  }}
                  disabled={isConcluindo}
                  title="Concluir correção"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  // Grid mode
  return (
    <Card className="h-full border-l-4 p-4" style={{ borderLeftColor: "#9333ea" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-purple-600" />
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          Correção Avulsa
        </Badge>
      </div>

      <h4 className="font-medium text-sm mb-2">
        {neoCorrecao.nome_cliente}
      </h4>

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {neoCorrecao.cidade}/{neoCorrecao.estado}
        </div>

        {neoCorrecao.data_correcao && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yyyy", { locale: ptBR })}
            {neoCorrecao.hora && ` às ${neoCorrecao.hora.slice(0, 5)}`}
          </div>
        )}

        {neoCorrecao.equipe_nome && (
          <Badge
            variant="outline"
            className="text-[10px]"
            style={{
              backgroundColor: `${corEquipe}15`,
              borderColor: `${corEquipe}40`,
              color: corEquipe
            }}
          >
            {neoCorrecao.equipe_nome}
          </Badge>
        )}

        {neoCorrecao.descricao && (
          <p className="text-muted-foreground italic line-clamp-2">
            {neoCorrecao.descricao}
          </p>
        )}
      </div>

      {onConcluir && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onConcluir(neoCorrecao.id)}
          disabled={isConcluindo}
        >
          <Check className="h-4 w-4 mr-1" />
          Concluir Correção
        </Button>
      )}
    </Card>
  );
}
