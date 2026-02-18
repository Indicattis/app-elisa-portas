import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, Clock, UserPlus, Timer, AlertTriangle, RefreshCw, CheckCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useOrdemProgress } from "@/hooks/useOrdemProgress";
import { ProdutosIcons } from "@/components/pedidos/ProdutosIcons";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";
import { cn } from "@/lib/utils";

interface OrdemPortaSocial {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  delegado_para_id?: string;
  delegado_em?: string;
  capturada_em?: string;
  tempo_conclusao_segundos?: number;
  em_backlog?: boolean;
  prioridade?: number;
  observacoes?: string;
  pedido?: {
    cliente_nome: string;
    numero_pedido: string;
    vendas?: {
      data_prevista_entrega?: string;
      observacoes_venda?: string;
    };
    produtos?: Array<{
      tipo_produto?: string;
      cor_nome?: string;
      cor_codigo_hex?: string;
      tamanho?: string;
      quantidade?: number;
      descricao?: string;
    }>;
  };
  delegado_para?: {
    nome: string;
    foto_perfil_url?: string;
  };
  delegado_por?: {
    nome: string;
  };
}

interface OrdemCardProps {
  ordem: OrdemPortaSocial;
  onDelegarOrdem: (ordemId: string) => void;
  onConcluirOrdem: (ordemId: string) => void;
  isDelegating?: boolean;
  isConcluindo?: boolean;
}

function OrdemCard({
  ordem,
  onDelegarOrdem,
  onConcluirOrdem,
  isDelegating = false,
  isConcluindo = false,
}: OrdemCardProps) {
  const todasConcluidas = ordem.status === 'concluido';
  const { data: ordemProgress } = useOrdemProgress(ordem.pedido_id);

  const { tempoDecorrido, deveAnimar } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas,
    responsavel_id: ordem.delegado_para_id,
  });

  const formatarData = (data?: string) => {
    if (!data) return '--/--/----';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  const estaDelegada = !!ordem.delegado_para_id;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all overflow-hidden",
        ordem.em_backlog && "border-2 border-red-500 shadow-lg shadow-red-500/20"
      )}
    >
      {/* HEADER */}
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
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              <Package className="h-3 w-3 mr-1" />
              Porta Social
            </Badge>
            {ordem.em_backlog && (
              <Badge className="bg-red-500 text-white text-[10px] sm:text-xs h-4 sm:h-5 px-1.5 sm:px-2">
                BACKLOG
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* BODY */}
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          {/* LATERAL ESQUERDA - Foto do delegado */}
          <div className="hidden sm:block flex-shrink-0">
            {estaDelegada ? (
              <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] ring-2 ring-primary/20">
                <AvatarImage 
                  src={ordem.delegado_para?.foto_perfil_url} 
                  alt={ordem.delegado_para?.nome}
                />
                <AvatarFallback className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {ordem.delegado_para?.nome?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-16 w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
                <UserPlus className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-muted-foreground/50" />
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

            {estaDelegada && ordem.delegado_para?.nome && (
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Delegado para</p>
                <p className="text-xs sm:text-sm font-semibold truncate">{ordem.delegado_para.nome}</p>
              </div>
            )}

            {ordem.delegado_por?.nome && (
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Delegado por</p>
                <p className="text-xs sm:text-sm truncate">{ordem.delegado_por.nome}</p>
              </div>
            )}

            {ordem.delegado_em && (
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Delegado em</p>
                <p className="text-xs sm:text-sm">{formatarData(ordem.delegado_em)}</p>
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
          </div>

          {/* LATERAL DIREITA - Botão Delegar ou Cronômetro */}
          <div className="w-full sm:w-auto flex-shrink-0">
            {!estaDelegada ? (
              <Button
                size="lg"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelegarOrdem(ordem.id);
                }}
                disabled={isDelegating}
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg flex flex-row sm:flex-col gap-2 p-2"
              >
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                <span className="text-xs font-semibold">Delegar</span>
              </Button>
            ) : tempoDecorrido !== '--:--:--' ? (
              <div 
                className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] sm:rounded-full rounded-lg bg-primary/10 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 border-2 border-primary relative overflow-hidden"
              >
                {deveAnimar && (
                  <div className="absolute inset-0 sm:rounded-full rounded-lg border-4 border-transparent border-t-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
                )}
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary relative z-10" />
                <span className="text-xs sm:text-sm font-mono font-bold text-primary relative z-10">{tempoDecorrido}</span>
              </div>
            ) : (
              <div className="h-12 w-full sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[100px] lg:w-[100px] rounded-lg bg-muted/30 flex items-center justify-center">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* FOOTER - Botão Concluir */}
      {estaDelegada && (
        <div className="border-t bg-muted/20 px-3 sm:px-4 py-2">
          <div className="flex items-center justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={() => onConcluirOrdem(ordem.id)}
              disabled={isConcluindo}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Concluir Ordem
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

interface ProducaoTerceirizacaoKanbanProps {
  ordensAFazer: OrdemPortaSocial[];
  isLoading: boolean;
  onDelegarOrdem: (ordemId: string) => void;
  onConcluirOrdem: (ordemId: string) => void;
  isDelegating?: boolean;
  isConcluindo?: boolean;
  onRefresh?: () => void;
}

export function ProducaoTerceirizacaoKanban({
  ordensAFazer,
  isLoading,
  onDelegarOrdem,
  onConcluirOrdem,
  isDelegating = false,
  isConcluindo = false,
  onRefresh,
}: ProducaoTerceirizacaoKanbanProps) {

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
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            Ordens de Porta Social
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
              onDelegarOrdem={onDelegarOrdem}
              onConcluirOrdem={onConcluirOrdem}
              isDelegating={isDelegating}
              isConcluindo={isConcluindo}
            />
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nenhuma ordem de porta social pendente
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
