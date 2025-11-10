import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Paintbrush, CheckCircle2, Play, UserCheck, Loader2, Timer, AlertTriangle, Archive, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useOrdemProgress } from "@/hooks/useOrdemProgress";
import { useState } from "react";
import { VisualizarBacklogOrdemModal } from "./VisualizarBacklogOrdemModal";

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
  isPronta?: boolean;
  isCapturing?: boolean;
  isEnviandoHistorico?: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onFinalizarPintura: (ordemId: string) => void;
  onCapturarOrdem: (ordemId: string) => void;
  onEnviarParaHistorico?: (ordemId: string) => void;
  onBacklogClick: (ordem: Ordem) => void;
}

function OrdemCard({
  ordem,
  showFinalizarButton = false,
  isPronta = false,
  isCapturing = false,
  isEnviandoHistorico = false,
  onOrdemClick,
  onFinalizarPintura,
  onCapturarOrdem,
  onEnviarParaHistorico,
  onBacklogClick,
}: OrdemCardProps) {
  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter((l: any) => l.concluida).length;
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;
  const todasConcluidas = linhas.length > 0 && linhas.every((l: any) => l.concluida);
  const { data: ordemProgress } = useOrdemProgress(ordem.pedido_id);
  const tempoDecorrido = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas && ordem.status === 'pronta',
  });

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
      )}
      onClick={() => onOrdemClick(ordem)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {ordem.em_backlog && (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500 animate-pulse" />
              )}
              <CardTitle className="text-base font-semibold truncate">
                {ordem.numero_ordem}
              </CardTitle>
              {ordemProgress && ordemProgress.total > 0 && (
                <Badge variant="outline" className="text-xs">
                  {ordemProgress.concluidas}/{ordemProgress.total}
                </Badge>
              )}
              {ordem.em_backlog && (
                <Badge className="bg-red-500 text-white text-xs">
                  BACKLOG
                </Badge>
              )}
              {ordem.capturada_em && tempoDecorrido !== '--:--:--' && (
                <Badge variant="outline" className="gap-1 flex-shrink-0">
                  <Timer className="h-3 w-3" />
                  {tempoDecorrido}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {ordem.pedido?.cliente_nome}
            </p>
          </div>
          <Badge variant={ordem.status === 'pronta' ? 'default' : 'secondary'}>
            {ordem.status === 'pendente' && 'Para Pintar'}
            {ordem.status === 'pintando' && 'Pintando'}
            {ordem.status === 'pronta' && 'Pronta'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordem.admin_users && (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={ordem.admin_users.foto_perfil_url} alt={ordem.admin_users.nome} />
              <AvatarFallback className="text-base font-semibold">
                {ordem.admin_users.nome?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-muted-foreground truncate">
              {ordem.admin_users.nome}
            </span>
          </div>
        )}

        {linhas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span className="font-medium">{linhasConcluidas}/{linhas.length}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  todasConcluidas ? "bg-green-600" : "bg-primary"
                )}
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {!ordem.responsavel_id && (
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isCapturing}
            onClick={(e) => {
              e.stopPropagation();
              onCapturarOrdem(ordem.id);
            }}
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Capturando...
              </>
            ) : (
              <>
                <UserCheck className="h-5 w-5 mr-2" />
                Capturar
              </>
            )}
          </Button>
        )}

        {showFinalizarButton && ordem.responsavel_id && todasConcluidas && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onFinalizarPintura(ordem.id);
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalizar Pintura
          </Button>
        )}

        {showFinalizarButton && ordem.responsavel_id && !todasConcluidas && (
          <p className="text-xs text-center text-muted-foreground">
            Marque todos os itens para finalizar
          </p>
        )}

        {ordem.em_backlog && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-red-500/50 text-red-600 hover:bg-red-500/10"
            onClick={(e) => {
              e.stopPropagation();
              onBacklogClick(ordem);
            }}
          >
            <FileText className="h-3 w-3 mr-2" />
            Ver Justificativa
          </Button>
        )}

        {isPronta && onEnviarParaHistorico && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onEnviarParaHistorico(ordem.id);
            }}
            disabled={isEnviandoHistorico}
          >
            <Archive className="h-3 w-3 mr-2" />
            Enviar para Histórico
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ProducaoPinturaKanbanProps {
  ordensParaPintar: Ordem[];
  ordensProntas: Ordem[];
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onFinalizarPintura: (ordemId: string) => void;
  onCapturarOrdem: (ordemId: string) => void;
  isCapturing?: boolean;
  onEnviarParaHistorico?: (ordemId: string) => void;
  isEnviandoHistorico?: boolean;
}

export function ProducaoPinturaKanban({
  ordensParaPintar,
  ordensProntas,
  isLoading,
  onOrdemClick,
  onFinalizarPintura,
  onCapturarOrdem,
  isCapturing = false,
  onEnviarParaHistorico,
  isEnviandoHistorico = false,
}: ProducaoPinturaKanbanProps) {
  const [backlogModalOpen, setBacklogModalOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<Ordem | null>(null);

  const handleBacklogClick = (ordem: Ordem) => {
    setSelectedOrdem(ordem);
    setBacklogModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna: Para Pintar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Para Pintar</h2>
            <Badge variant="secondary" className="ml-auto">
              {ordensParaPintar.length}
            </Badge>
          </div>
          <div className="space-y-3">
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
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhuma ordem pendente
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Coluna: Pronta */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Pronta</h2>
            <Badge variant="secondary" className="ml-auto">
              {ordensProntas.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {ordensProntas.map((ordem) => (
              <OrdemCard
                key={ordem.id}
                ordem={ordem}
                isPronta={true}
                isEnviandoHistorico={isEnviandoHistorico}
                onOrdemClick={onOrdemClick}
                onFinalizarPintura={onFinalizarPintura}
                onCapturarOrdem={onCapturarOrdem}
                onEnviarParaHistorico={onEnviarParaHistorico}
                onBacklogClick={handleBacklogClick}
              />
            ))}
            {ordensProntas.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhuma ordem concluída
                </CardContent>
              </Card>
            )}
          </div>
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
