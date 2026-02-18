import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, Clock, UserCheck, Timer, AlertTriangle, FileText, RefreshCw, PauseCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useOrdemProgress } from "@/hooks/useOrdemProgress";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { VisualizarBacklogOrdemModal } from "./VisualizarBacklogOrdemModal";
import { ProdutosIcons } from "@/components/pedidos/ProdutosIcons";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";
import { toast } from "sonner";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
  cor_nome?: string;
}

interface ObservacaoVisita {
  id: string;
  produto_venda_id: string;
  indice_porta: number;
  interna_externa: string;
  lado_motor: string;
  posicao_guia: string;
  opcao_guia: string;
  aparencia_testeira: string;
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
  pausada?: boolean;
  pausada_em?: string;
  justificativa_pausa?: string;
  tempo_acumulado_segundos?: number;
  linhas?: LinhaOrdem[];
  observacoesVisita?: ObservacaoVisita[];
  pedido?: {
    cliente_nome: string;
    numero_pedido: string;
    venda_id?: string;
    vendas?: {
      data_prevista_entrega?: string;
      observacoes_venda?: string;
    };
    produtos?: Array<{
      tipo_produto?: string;
      catalogo_cores?: { nome: string; codigo_hex: string } | null;
      cor?: { nome: string; codigo_hex: string } | null;
    }>;
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

// Componente separado para o card de ordem
const LIMITE_QUALIDADE = 2 * 60 * 60; // 7200 segundos

interface OrdemCardProps {
  ordem: Ordem;
  isConcluida: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isCapturing?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  tipoOrdem?: TipoOrdem;
}

function OrdemCard({
  ordem,
  isConcluida,
  onOrdemClick,
  onCapturarOrdem,
  isCapturing = false,
  currentUserId,
  currentUserRole,
  tipoOrdem,
}: OrdemCardProps) {
  const [backlogModalOpen, setBacklogModalOpen] = useState(false);
  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const todasConcluidas = linhas.length > 0 && linhas.every(l => l.concluida);
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;

  const { data: ordemProgress } = useOrdemProgress(ordem.pedido_id);

  const { tempoDecorrido, deveAnimar, segundosTotais } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas && ordem.status === 'concluido',
    responsavel_id: ordem.responsavel_id,
    pausada: ordem.pausada,
    tempo_acumulado_segundos: ordem.tempo_acumulado_segundos,
  });

  const formatarData = (data?: string) => {
    if (!data) return '--/--/----';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  const handleCardClick = () => {
    onOrdemClick(ordem);
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all overflow-hidden cursor-pointer",
        ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
      )}
      onClick={handleCardClick}
    >
      {/* HEADER - Mobile First */}
      <CardHeader className="min-h-[40px] py-2 px-3 sm:px-4 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
            {ordem.em_backlog && (
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-red-500 animate-pulse" />
            )}
            <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-none">
              {ordem.pedido?.cliente_nome}
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              Entrega: {formatarData(ordem.pedido?.vendas?.data_prevista_entrega)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-0">
            {ordem.pedido?.produtos && ordem.pedido.produtos.length > 0 && (
              <ProdutosIcons produtos={ordem.pedido.produtos} />
            )}
            {ordem.em_backlog && (
              <Badge className="bg-red-500 text-white text-[10px] sm:text-xs h-4 sm:h-5 px-1.5 sm:px-2">
                BACKLOG
              </Badge>
            )}
            {ordem.pausada && (
              <Badge className="bg-yellow-500 text-white text-[10px] sm:text-xs h-4 sm:h-5 px-1.5 sm:px-2">
                <PauseCircle className="h-3 w-3 mr-1" />
                PAUSADA
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* BODY - Mobile First */}
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          {/* LATERAL ESQUERDA - Foto do responsável (oculta em mobile pequeno) */}
          <div className="hidden sm:block flex-shrink-0">
            {ordem.responsavel_id ? (
              <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] ring-2 ring-primary/20">
                <AvatarImage 
                  src={ordem.admin_users?.foto_perfil_url} 
                  alt={ordem.admin_users?.nome}
                />
                <AvatarFallback className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {ordem.admin_users?.nome?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-16 w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                <UserCheck className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* CENTRO - Informações */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 min-w-0 w-full">
            {/* Data entrega visível apenas em mobile */}
            <div className="sm:hidden">
              <p className="text-[10px] text-muted-foreground">Entrega</p>
              <p className="text-xs font-semibold">{formatarData(ordem.pedido?.vendas?.data_prevista_entrega)}</p>
            </div>

            {ordem.responsavel_id && ordem.admin_users?.nome && (
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Responsável</p>
                <p className="text-xs sm:text-sm font-semibold truncate">{ordem.admin_users.nome}</p>
              </div>
            )}


            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Cores das Portas</p>
              <CoresPortasEnrolar produtos={ordem.pedido?.produtos} />
            </div>


            {ordem.pedido?.vendas?.observacoes_venda && (
              <div className="col-span-1 sm:col-span-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <FileText className="h-3 w-3" />
                  Observações Gerais
                </p>
                <p className="text-[10px] sm:text-xs line-clamp-2">{ordem.pedido.vendas.observacoes_venda}</p>
              </div>
            )}

            {ordem.observacoes && (
              <div className="col-span-1 sm:col-span-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Observações da Ordem</p>
                <p className="text-[10px] sm:text-xs line-clamp-2">{ordem.observacoes}</p>
              </div>
            )}
          </div>

          {/* LATERAL DIREITA - Botão Capturar ou Cronômetro */}
          <div className="w-full sm:w-auto flex-shrink-0">
            {!ordem.responsavel_id ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapturarOrdem?.(ordem.id);
                }}
                disabled={isCapturing}
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg flex flex-row sm:flex-col gap-2 p-2"
              >
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                <span className="text-xs font-semibold">Capturar</span>
              </Button>
            ) : ordem.capturada_em && tempoDecorrido !== '--:--:--' && ordem.responsavel_id ? (
              (() => {
                const isVermelho = tipoOrdem === 'qualidade' && segundosTotais >= LIMITE_QUALIDADE;
                return (
                  <div 
                    className={cn(
                      "h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 border-2 relative overflow-hidden",
                      isVermelho ? "bg-red-500/10 border-red-500" : "bg-primary/10 border-primary"
                    )}
                  >
                    {deveAnimar && (
                      <div className={cn(
                        "absolute inset-0 sm:rounded-full rounded-lg border-4 border-transparent animate-spin",
                        isVermelho ? "border-t-red-500/50" : "border-t-primary/50"
                      )} style={{ animationDuration: '3s' }} />
                    )}
                    <Timer className={cn("h-4 w-4 sm:h-5 sm:w-5 relative z-10", isVermelho ? "text-red-500" : "text-primary")} />
                    <span className={cn("text-xs sm:text-sm font-mono font-bold relative z-10", isVermelho ? "text-red-500" : "text-primary")}>{tempoDecorrido}</span>
                  </div>
                );
              })()
            ) : (
              <div 
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] rounded-lg bg-muted/30 flex items-center justify-center"
              >
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* FOOTER - Barra de Progresso e Ações */}
      {linhas.length > 0 && (
        <div className="border-t bg-muted/20 px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="font-semibold">{linhasConcluidas}/{linhas.length} itens</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1 sm:h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {ordem.em_backlog && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-600 hover:bg-red-500/10 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBacklogModalOpen(true);
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">Ver </span>Justificativa
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
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isCapturing?: boolean;
  tipoOrdem: TipoOrdem;
  onRefresh?: () => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export function ProducaoKanban({
  ordensAFazer,
  isLoading,
  onOrdemClick,
  onCapturarOrdem,
  isCapturing = false,
  tipoOrdem,
  onRefresh,
  currentUserId,
  currentUserRole,
}: ProducaoKanbanProps) {

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            Ordens Pendentes
          </h2>
          <Badge variant="secondary" className="text-xs">{isLoading ? '...' : ordensAFazer.length}</Badge>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        )}
      </div>

      {/* Lista de Ordens */}
      <div className="space-y-2 sm:space-y-3">
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
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              tipoOrdem={tipoOrdem}
            />
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nenhuma ordem pendente
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
