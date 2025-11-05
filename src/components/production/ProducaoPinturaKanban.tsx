import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paintbrush, CheckCircle2, Play, UserCheck, Loader2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";

interface Ordem {
  id: string;
  numero_ordem: string;
  status: string;
  responsavel_id?: string;
  capturada_em?: string;
  tempo_conclusao_segundos?: number;
  pedido?: {
    cliente_nome: string;
  };
  admin_users?: {
    nome: string;
  };
  linhas?: any[];
}

interface ProducaoPinturaKanbanProps {
  ordensParaPintar: Ordem[];
  ordensProntas: Ordem[];
  isLoading: boolean;
  onOrdemClick: (ordem: Ordem) => void;
  onFinalizarPintura: (ordemId: string) => void;
  onCapturarOrdem: (ordemId: string) => void;
  isCapturing?: boolean;
}

export function ProducaoPinturaKanban({
  ordensParaPintar,
  ordensProntas,
  isLoading,
  onOrdemClick,
  onFinalizarPintura,
  onCapturarOrdem,
  isCapturing = false,
}: ProducaoPinturaKanbanProps) {
  const renderOrdemCard = (ordem: Ordem, showFinalizarButton = false) => {
    const linhas = ordem.linhas || [];
    const linhasConcluidas = linhas.filter((l: any) => l.concluida).length;
    const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;
    const todasConcluidas = linhas.length > 0 && linhas.every((l: any) => l.concluida);
    const tempoDecorrido = useCronometroOrdem({
      capturada_em: ordem.capturada_em,
      tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
      todas_linhas_concluidas: todasConcluidas && ordem.status === 'pronta',
    });

    return (
      <Card 
        key={ordem.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onOrdemClick(ordem)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {ordem.numero_ordem}
              </CardTitle>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground truncate">
                  {ordem.admin_users.nome}
                </span>
              </div>
              {ordem.capturada_em && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-mono text-orange-600 dark:text-orange-400">
                    {tempoDecorrido}
                  </span>
                </div>
              )}
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
              size="sm"
              className="w-full"
              disabled={isCapturing}
              onClick={(e) => {
                e.stopPropagation();
                onCapturarOrdem(ordem.id);
              }}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>
    );
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
          {ordensParaPintar.map((ordem) => renderOrdemCard(ordem, true))}
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
          {ordensProntas.map((ordem) => renderOrdemCard(ordem, false))}
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
  );
}
