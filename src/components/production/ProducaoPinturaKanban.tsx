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
    produtos?: any[];
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
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;
  const todasConcluidas = linhas.length > 0 && linhas.every((l: any) => l.concluida);
  
  // Extrair cores únicas do pedido
  const coresUnicas = [...new Set(linhas.map((l: any) => l.cor_nome).filter(Boolean))].sort();
  
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
      {/* HEADER */}
      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
        <div className="flex items-center justify-between w-full gap-4 h-full">
          <div className="flex items-center gap-3 text-xs">
            {ordem.em_backlog && (
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-500 animate-pulse" />
            )}
            <span className="font-bold">
              {ordem.numero_ordem}
            </span>
            <span className="text-muted-foreground">
              {ordem.pedido?.cliente_nome}
            </span>
            {ordem.capturada_em && tempoDecorrido !== '--:--:--' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1 flex-shrink-0 h-5",
                  deveAnimar && "animate-pulse"
                )}
              >
                <Timer className="h-3 w-3" />
                {tempoDecorrido}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ordem.pedido?.produtos && ordem.pedido.produtos.length > 0 && (
              <ProdutosIcons produtos={ordem.pedido.produtos} />
            )}
            {ordem.em_backlog && (
              <Badge className="bg-red-500 text-white text-xs h-5">
                BACKLOG
              </Badge>
            )}
          </div>
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

            {ordem.status && (
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={ordem.status === 'pronta' ? 'default' : 'secondary'} className="mt-1">
                  {ordem.status === 'pendente' && 'Para Pintar'}
                  {ordem.status === 'pintando' && 'Pintando'}
                  {ordem.status === 'pronta' && 'Pronta'}
                </Badge>
              </div>
            )}

            {coresUnicas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Cores</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {coresUnicas.map((cor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* LATERAL DIREITA - Botão Capturar ou Status */}
          <div className="flex-shrink-0">
            {!ordem.responsavel_id ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onCapturarOrdem(ordem.id);
                }}
                disabled={isCapturing}
                className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs font-semibold">...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-8 w-8" />
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
                className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-xs font-semibold">Finalizar</span>
              </Button>
            ) : ordem.capturada_em && tempoDecorrido !== '--:--:--' ? (
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
                <Paintbrush className="h-8 w-8 text-muted-foreground/50" />
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
                {showFinalizarButton && ordem.responsavel_id && !todasConcluidas && (
                  <span className="text-muted-foreground">Marque todos para finalizar</span>
                )}
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
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
            <div className="flex items-center gap-2">
              {ordem.em_backlog && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-600 hover:bg-red-500/10 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBacklogClick(ordem);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-orange-600" />
              Ordens de Pintura
            </h2>
            <Badge variant="secondary">{isLoading ? '...' : ordensParaPintar.length}</Badge>
          </div>
        </div>

        {/* Lista de Ordens */}
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
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Paintbrush className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
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
