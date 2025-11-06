import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, CheckCircle2, Clock, UserCheck, Timer, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { cn } from "@/lib/utils";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  observacoes?: string;
  responsavel_id?: string;
  capturada_em?: string;
  tempo_conclusao_segundos?: number;
  em_backlog?: boolean;
  prioridade?: number;
  linhas?: LinhaOrdem[];
  pedido?: {
    cliente_nome: string;
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface ProducaoKanbanProps {
  ordensAFazer: Ordem[];
  ordensConcluidas: Ordem[];
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isCapturing?: boolean;
  tipoOrdem: TipoOrdem;
}

export function ProducaoKanban({
  ordensAFazer,
  ordensConcluidas,
  isLoading,
  onOrdemClick,
  onCapturarOrdem,
  isCapturing = false,
  tipoOrdem,
}: ProducaoKanbanProps) {
  
  const renderOrdemCard = (ordem: Ordem) => {
    const linhas = ordem.linhas || [];
    const linhasConcluidas = linhas.filter(l => l.concluida).length;
    const todasConcluidas = linhas.length > 0 && linhas.every(l => l.concluida);
    const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;

    const tempoDecorrido = useCronometroOrdem({
      capturada_em: ordem.capturada_em,
      tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
      todas_linhas_concluidas: todasConcluidas && ordem.status === 'concluido',
    });

    return (
      <Card 
        key={ordem.id} 
        className={cn(
          "hover:shadow-md transition-all",
          ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
              onClick={() => onOrdemClick(ordem)}
            >
              {ordem.em_backlog && (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500 animate-pulse" />
              )}
              <Package className="h-4 w-4 flex-shrink-0 text-primary" />
              <CardTitle className="text-sm font-semibold truncate">
                {ordem.numero_ordem}
              </CardTitle>
              {ordem.em_backlog && (
                <Badge className="bg-red-500 text-white text-xs">
                  BACKLOG
                </Badge>
              )}
            </div>
            
            {ordem.responsavel_id ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={ordem.admin_users?.foto_perfil_url} alt={ordem.admin_users?.nome} />
                  <AvatarFallback className="text-xs">
                    {ordem.admin_users?.nome?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-20">
                  {ordem.admin_users?.nome}
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapturarOrdem?.(ordem.id);
                }}
                disabled={isCapturing}
                className="h-7 text-xs flex-shrink-0"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Capturar
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent 
          className="space-y-3 cursor-pointer"
          onClick={() => onOrdemClick(ordem)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 space-y-1 min-w-0">
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium truncate">{ordem.pedido?.cliente_nome}</p>
            </div>
            
            {ordem.capturada_em && tempoDecorrido !== '--:--:--' && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                <Timer className="h-3 w-3" />
                {tempoDecorrido}
              </Badge>
            )}
          </div>

          {linhas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{linhasConcluidas}/{linhas.length} itens</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {ordem.observacoes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {ordem.observacoes}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coluna: A Fazer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            A Fazer
          </h2>
          <Badge variant="secondary">{isLoading ? '...' : ordensAFazer.length}</Badge>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            renderSkeletons()
          ) : ordensAFazer.length > 0 ? (
            ordensAFazer.map(renderOrdemCard)
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ordem pendente
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Coluna: Concluídas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Concluídas
          </h2>
          <Badge variant="secondary">{isLoading ? '...' : ordensConcluidas.length}</Badge>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            renderSkeletons()
          ) : ordensConcluidas.length > 0 ? (
            ordensConcluidas.map(renderOrdemCard)
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ordem concluída ainda
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
