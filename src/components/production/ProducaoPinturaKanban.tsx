import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Paintbrush, CheckCircle2, UserCheck, Loader2, Timer, AlertTriangle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useOrdemProgress } from "@/hooks/useOrdemProgress";
import { useState } from "react";
import { VisualizarBacklogOrdemModal } from "./VisualizarBacklogOrdemModal";
import { ProdutosIcons } from "@/components/pedidos/ProdutosIcons";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";

interface Ordem {
  id: string;
  numero_ordem: string;
  status: string;
  pedido_id: string;
  responsavel_id?: string;
  capturada_em?: string;
  tempo_conclusao_segundos?: number;
  em_backlog?: boolean;
  prioridade?: number;
  pedido?: {
    cliente_nome: string;
    vendas?: {
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
  linhas?: any[];
}

interface OrdemCardProps {
  ordem: Ordem;
  showFinalizarButton?: boolean;
  isCapturing?: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onFinalizarPintura: (ordemId: string) => void;
  onCapturarOrdem: (ordemId: string) => void;
  onBacklogClick: (ordem: Ordem) => void;
}

function OrdemCard({
  ordem,
  showFinalizarButton = false,
  isCapturing = false,
  onOrdemClick,
  onFinalizarPintura,
  onCapturarOrdem,
  onBacklogClick,
}: OrdemCardProps) {
  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter((l: any) => l.concluida).length;
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 100;
  const todasConcluidas = linhas.length === 0 || linhas.every((l: any) => l.concluida);
  
  const { data: ordemProgress } = useOrdemProgress(ordem.pedido_id);
  const { tempoDecorrido, deveAnimar } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas && ordem.status === 'pronta',
    responsavel_id: ordem.responsavel_id,
  });

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all overflow-hidden",
        ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
      )}
    >
      {/* HEADER - Mobile First */}
      <CardHeader className="min-h-[40px] py-2 px-3 sm:px-4 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
            {ordem.em_backlog && (
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-red-500 animate-pulse" />
            )}
            <span className="text-foreground font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">
              {ordem.pedido?.cliente_nome}
            </span>
            {ordem.capturada_em && tempoDecorrido !== '--:--:--' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1 flex-shrink-0 h-4 sm:h-5 text-[10px] sm:text-xs px-1.5",
                  deveAnimar && "animate-pulse"
                )}
              >
                <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {tempoDecorrido}
              </Badge>
            )}
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
          </div>
        </div>
      </CardHeader>

      {/* BODY - Mobile First */}
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          {/* LATERAL ESQUERDA - Foto do responsável (oculta em mobile pequeno) */}
          <div 
            className="hidden sm:block flex-shrink-0 cursor-pointer"
            onClick={() => onOrdemClick(ordem)}
          >
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
          <div 
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 cursor-pointer min-w-0 w-full"
            onClick={() => onOrdemClick(ordem)}
          >
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

            {ordem.status && (
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
                <Badge variant={ordem.status === 'pronta' ? 'default' : 'secondary'} className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs h-5">
                  {ordem.status === 'pendente' && 'Para Pintar'}
                  {ordem.status === 'pintando' && 'Pintando'}
                  {ordem.status === 'pronta' && 'Pronta'}
                </Badge>
              </div>
            )}

            {ordem.pedido?.vendas?.observacoes_venda && (
              <div className="col-span-1 sm:col-span-2">
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <FileText className="h-3 w-3" />
                  Observações da Visita
                </p>
                <p className="text-[10px] sm:text-xs line-clamp-2 text-amber-700 dark:text-amber-300">{ordem.pedido.vendas.observacoes_venda}</p>
              </div>
            )}
          </div>

          {/* LATERAL DIREITA - Botão Capturar ou Status */}
          <div className="w-full sm:w-auto flex-shrink-0">
            {!ordem.responsavel_id ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapturarOrdem(ordem.id);
                }}
                disabled={isCapturing}
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg flex flex-row sm:flex-col gap-2 p-2"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin" />
                    <span className="text-xs font-semibold">...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                    <span className="text-xs font-semibold">Capturar</span>
                  </>
                )}
              </Button>
            ) : showFinalizarButton && todasConcluidas ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalizarPintura(ordem.id);
                }}
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg flex flex-row sm:flex-col gap-2 p-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                <span className="text-xs font-semibold">Finalizar</span>
              </Button>
            ) : ordem.capturada_em && tempoDecorrido !== '--:--:--' ? (
              <div 
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg bg-primary/10 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 border-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors relative overflow-hidden"
                onClick={() => onOrdemClick(ordem)}
              >
                {deveAnimar && (
                  <div className="absolute inset-0 sm:rounded-full rounded-lg border-4 border-transparent border-t-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
                )}
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary relative z-10" />
                <span className="text-xs sm:text-sm font-mono font-bold text-primary relative z-10">{tempoDecorrido}</span>
              </div>
            ) : (
              <div 
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] rounded-lg bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onOrdemClick(ordem)}
              >
                <Paintbrush className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
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
                {showFinalizarButton && ordem.responsavel_id && !todasConcluidas && (
                  <span className="text-muted-foreground text-[9px] sm:text-xs">Marque todos para finalizar</span>
                )}
              </div>
              <div className="w-full bg-secondary rounded-full h-1 sm:h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    todasConcluidas ? "bg-green-600" : "bg-primary"
                  )}
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
                    onBacklogClick(ordem);
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
    </Card>
  );
}

interface ProducaoPinturaKanbanProps {
  ordensParaPintar: Ordem[];
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onFinalizarPintura: (ordemId: string) => void;
  onCapturarOrdem: (ordemId: string) => void;
  isCapturing?: boolean;
}

export function ProducaoPinturaKanban({
  ordensParaPintar,
  isLoading,
  onOrdemClick,
  onFinalizarPintura,
  onCapturarOrdem,
  isCapturing = false,
}: ProducaoPinturaKanbanProps) {
  const [backlogModalOpen, setBacklogModalOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<Ordem | null>(null);

  const handleBacklogClick = (ordem: Ordem) => {
    setSelectedOrdem(ordem);
    setBacklogModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Paintbrush className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              Ordens de Pintura
            </h2>
            <Badge variant="secondary" className="text-xs">{isLoading ? '...' : ordensParaPintar.length}</Badge>
          </div>
        </div>

        {/* Lista de Ordens */}
        <div className="space-y-2 sm:space-y-3">
          {ordensParaPintar.map((ordem) => (
            <OrdemCard
              key={ordem.id}
              ordem={ordem}
              showFinalizarButton={true}
              isCapturing={isCapturing}
              onOrdemClick={onOrdemClick}
              onFinalizarPintura={onFinalizarPintura}
              onCapturarOrdem={onCapturarOrdem}
              onBacklogClick={handleBacklogClick}
            />
          ))}
          {ordensParaPintar.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <Paintbrush className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nenhuma ordem pendente
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Backlog */}
      {selectedOrdem && (
        <VisualizarBacklogOrdemModal
          ordemId={selectedOrdem.id}
          pedidoId={selectedOrdem.pedido_id}
          numeroOrdem={selectedOrdem.numero_ordem}
          open={backlogModalOpen}
          onOpenChange={setBacklogModalOpen}
        />
      )}
    </>
  );
}
