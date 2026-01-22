import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Hammer,
  Users
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NeoInstalacao } from "@/types/neoInstalacao";

interface NeoInstalacaoCardGestaoProps {
  neoInstalacao: NeoInstalacao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
}

export function NeoInstalacaoCardGestao({
  neoInstalacao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo,
}: NeoInstalacaoCardGestaoProps) {
  const corEquipe = neoInstalacao.equipe?.cor || "#6366f1";

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
                className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/30"
              >
                <Hammer className="h-3 w-3 mr-1" />
                Avulso
              </Badge>
            </div>

            {/* Col 2: Nome do cliente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-semibold text-sm truncate text-white">
                  {neoInstalacao.nome_cliente && neoInstalacao.nome_cliente.length > 25 
                    ? `${neoInstalacao.nome_cliente.substring(0, 25)}...` 
                    : neoInstalacao.nome_cliente}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{neoInstalacao.nome_cliente}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 3: Cidade/Estado */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="text-[10px] truncate">
                    {neoInstalacao.cidade}/{neoInstalacao.estado}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{neoInstalacao.cidade}, {neoInstalacao.estado}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 4: Data */}
            <div className="text-center">
              {neoInstalacao.data_instalacao ? (
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[9px] font-medium text-blue-400">
                    Agendado
                  </span>
                  <span className="text-xs font-bold text-blue-400">
                    {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yy", { locale: ptBR })}
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
              {neoInstalacao.hora ? (
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium">
                    {neoInstalacao.hora.substring(0, 5)}
                  </span>
                </div>
              ) : (
                <span className="text-[9px] text-muted-foreground/50">—</span>
              )}
            </div>

            {/* Col 6: Tipo - sempre instalação */}
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 bg-blue-500/10 text-blue-400 border-blue-500/50">
                <Hammer className="h-2.5 w-2.5" />
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
                    {neoInstalacao.equipe_nome 
                      ? (neoInstalacao.equipe_nome.length > 12 
                          ? `${neoInstalacao.equipe_nome.substring(0, 12)}...` 
                          : neoInstalacao.equipe_nome)
                      : "Sem equipe"}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{neoInstalacao.equipe_nome || "Sem equipe definida"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Col 8: Descrição resumida */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground truncate">
                  {neoInstalacao.descricao 
                    ? (neoInstalacao.descricao.length > 40 
                        ? `${neoInstalacao.descricao.substring(0, 40)}...` 
                        : neoInstalacao.descricao)
                    : "—"}
                </span>
              </TooltipTrigger>
              {neoInstalacao.descricao && (
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{neoInstalacao.descricao}</p>
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
                    onConcluir(neoInstalacao.id);
                  }}
                  disabled={isConcluindo}
                  title="Concluir instalação"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  // View mode: grid
  return (
    <Card className="p-4 border-l-4 h-full flex flex-col" style={{ borderLeftColor: corEquipe }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge 
          variant="outline" 
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Hammer className="h-3 w-3 mr-1" />
          Avulso
        </Badge>
        <Badge 
          variant="secondary" 
          style={{ 
            backgroundColor: `${corEquipe}20`,
            color: corEquipe,
          }}
        >
          {neoInstalacao.equipe_nome || "Sem equipe"}
        </Badge>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{neoInstalacao.nome_cliente}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {neoInstalacao.data_instalacao && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          {neoInstalacao.hora && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{neoInstalacao.hora.substring(0, 5)}</span>
            </div>
          )}
        </div>

        {neoInstalacao.descricao && (
          <div className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
            {neoInstalacao.descricao}
          </div>
        )}
      </div>

      {onConcluir && (
        <div className="mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConcluir(neoInstalacao.id)}
            disabled={isConcluindo}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluir Instalação
          </Button>
        </div>
      )}
    </Card>
  );
}
