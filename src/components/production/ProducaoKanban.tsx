import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, CheckCircle2, Clock, UserCheck, Timer, AlertTriangle, Archive, FileText, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useOrdemProgress } from "@/hooks/useOrdemProgress";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { VisualizarBacklogOrdemModal } from "./VisualizarBacklogOrdemModal";

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
    numero_pedido: string;
    venda_id?: string;
    vendas?: {
      data_prevista_entrega?: string;
    };
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

// Componente separado para o card de ordem
interface OrdemCardProps {
  ordem: Ordem;
  isConcluida: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isCapturing?: boolean;
  onEnviarParaHistorico?: (ordemId: string) => void;
  isEnviandoHistorico?: boolean;
}

function OrdemCard({
  ordem,
  isConcluida,
  onOrdemClick,
  onCapturarOrdem,
  isCapturing = false,
  onEnviarParaHistorico,
  isEnviandoHistorico = false,
}: OrdemCardProps) {
  const [backlogModalOpen, setBacklogModalOpen] = useState(false);
  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const todasConcluidas = linhas.length > 0 && linhas.every(l => l.concluida);
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;

  const { data: ordemProgress } = useOrdemProgress(ordem.pedido_id);

  const { tempoDecorrido, deveAnimar } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas && ordem.status === 'concluido',
    responsavel_id: ordem.responsavel_id,
  });

  const formatarData = (data?: string) => {
    if (!data) return '--/--/----';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all overflow-hidden",
        ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
      )}
    >
      {/* HEADER */}
      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
        <div className="flex items-center justify-between w-full gap-4 h-full">
          <div className="flex items-center gap-3 text-xs">
            {ordem.em_backlog && (
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-500 animate-pulse" />
            )}
            <span className="font-medium text-muted-foreground">
              Pedido #{ordem.pedido?.numero_pedido}
            </span>
            <span className="font-bold">
              {ordem.numero_ordem}
            </span>
            <span className="text-muted-foreground">
              {ordem.pedido?.cliente_nome}
            </span>
            <span className="text-muted-foreground">
              Entrega: {formatarData(ordem.pedido?.vendas?.data_prevista_entrega)}
            </span>
          </div>
          {ordem.em_backlog && (
            <Badge className="bg-red-500 text-white text-xs h-5">
              BACKLOG
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {/* BODY */}
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* LATERAL ESQUERDA - Foto do responsável */}
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={() => onOrdemClick(ordem)}
          >
            {ordem.responsavel_id ? (
              <Avatar className="h-[100px] w-[100px] ring-2 ring-primary/20">
                <AvatarImage 
                  src={ordem.admin_users?.foto_perfil_url} 
                  alt={ordem.admin_users?.nome}
                />
                <AvatarFallback className="text-3xl font-bold">
                  {ordem.admin_users?.nome?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-[100px] w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                <UserCheck className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* CENTRO - Informações */}
          <div 
            className="flex-1 space-y-3 cursor-pointer min-w-0"
            onClick={() => onOrdemClick(ordem)}
          >
            {ordem.responsavel_id && ordem.admin_users?.nome && (
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="text-sm font-semibold truncate">{ordem.admin_users.nome}</p>
              </div>
            )}

            {ordemProgress && ordemProgress.total > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Progresso Geral</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {ordemProgress.concluidas}/{ordemProgress.total} ordens
                </Badge>
              </div>
            )}

            {ordem.observacoes && (
              <div>
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-xs line-clamp-2">{ordem.observacoes}</p>
              </div>
            )}

          </div>

          {/* LATERAL DIREITA - Botão Capturar ou Cronômetro */}
          <div className="flex-shrink-0">
            {!ordem.responsavel_id ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapturarOrdem?.(ordem.id);
                }}
                disabled={isCapturing}
                className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
              >
                <UserCheck className="h-8 w-8" />
                <span className="text-xs font-semibold">Capturar</span>
              </Button>
            ) : ordem.capturada_em && tempoDecorrido !== '--:--:--' && ordem.responsavel_id ? (
              <div 
                className="h-[100px] w-[100px] rounded-full bg-primary/10 flex flex-col items-center justify-center gap-1 border-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors relative overflow-hidden"
                onClick={() => onOrdemClick(ordem)}
              >
                {deveAnimar && (
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
                )}
                <Timer className="h-5 w-5 text-primary relative z-10" />
                <span className="text-sm font-mono font-bold text-primary relative z-10">{tempoDecorrido}</span>
              </div>
            ) : (
              <div 
                className="h-[100px] w-[100px] rounded-lg bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onOrdemClick(ordem)}
              >
                <Clock className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* FOOTER - Barra de Progresso e Ações */}
      {linhas.length > 0 && (
        <div className="border-t bg-muted/20 px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{linhasConcluidas}/{linhas.length} itens</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex items-center gap-2">
              {ordem.em_backlog && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-600 hover:bg-red-500/10 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBacklogModalOpen(true);
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Ver Justificativa
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Backlog */}
      {ordem.em_backlog && (
        <VisualizarBacklogOrdemModal
          ordemId={ordem.id}
          pedidoId={ordem.pedido_id}
          numeroOrdem={ordem.numero_ordem}
          open={backlogModalOpen}
          onOpenChange={setBacklogModalOpen}
        />
      )}
    </Card>
  );
}

interface ProducaoKanbanProps {
  ordensAFazer: Ordem[];
  ordensConcluidas: Ordem[];
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isCapturing?: boolean;
  tipoOrdem: TipoOrdem;
  onEnviarParaHistorico?: (ordemId: string) => void;
  isEnviandoHistorico?: boolean;
}

export function ProducaoKanban({
  ordensAFazer,
  ordensConcluidas,
  isLoading,
  onOrdemClick,
  onCapturarOrdem,
  isCapturing = false,
  tipoOrdem,
  onEnviarParaHistorico,
  isEnviandoHistorico = false,
}: ProducaoKanbanProps) {
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);

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
    <div className="space-y-6">
      {/* Header com botão toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            A Fazer
          </h2>
          <Badge variant="secondary">{isLoading ? '...' : ordensAFazer.length}</Badge>
        </div>
        <Button
          variant={mostrarConcluidas ? "default" : "outline"}
          size="sm"
          onClick={() => setMostrarConcluidas(!mostrarConcluidas)}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Concluídas ({ordensConcluidas.length})
        </Button>
      </div>

      {/* Coluna: A Fazer */}
      <div className="space-y-4">

        <div className="space-y-3">
          {isLoading ? (
            renderSkeletons()
          ) : ordensAFazer.length > 0 ? (
            ordensAFazer.map(ordem => (
              <OrdemCard
                key={ordem.id}
                ordem={ordem}
                isConcluida={false}
                onOrdemClick={onOrdemClick}
                onCapturarOrdem={onCapturarOrdem}
                isCapturing={isCapturing}
                onEnviarParaHistorico={onEnviarParaHistorico}
                isEnviandoHistorico={isEnviandoHistorico}
              />
            ))
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

      {/* Coluna: Concluídas (condicional) */}
      {mostrarConcluidas && (
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
              ordensConcluidas.map(ordem => (
                <div key={ordem.id} className="relative group">
                  <OrdemCard
                    ordem={ordem}
                    isConcluida={true}
                    onOrdemClick={onOrdemClick}
                    onCapturarOrdem={onCapturarOrdem}
                    isCapturing={isCapturing}
                    onEnviarParaHistorico={onEnviarParaHistorico}
                    isEnviandoHistorico={isEnviandoHistorico}
                  />
                  {onEnviarParaHistorico && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnviarParaHistorico(ordem.id);
                      }}
                      disabled={isEnviandoHistorico}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
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
      )}
    </div>
  );
}
