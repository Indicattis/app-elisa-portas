import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface VisualizarBacklogOrdemModalProps {
  ordemId: string;
  pedidoId: string;
  numeroOrdem: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisualizarBacklogOrdemModal({
  ordemId,
  pedidoId,
  numeroOrdem,
  open,
  onOpenChange
}: VisualizarBacklogOrdemModalProps) {
  // Buscar dados do pedido para pegar o motivo do backlog
  const { data: pedido, isLoading } = useQuery({
    queryKey: ['pedido-backlog', pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select('motivo_backlog, updated_at, numero_pedido')
        .eq('id', pedidoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open, // Só busca quando o modal está aberto
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Justificativa do Backlog
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm">
                {numeroOrdem}
              </p>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      EM BACKLOG
                    </Badge>
                    {pedido?.updated_at && (
                      <span className="text-xs text-muted-foreground">
                        desde {format(new Date(pedido.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {/* Referência ao Pedido */}
                  {pedido?.numero_pedido && (
                    <div className="text-xs text-muted-foreground">
                      Pedido: <span className="font-medium">{pedido.numero_pedido}</span>
                    </div>
                  )}

                  {/* Justificativa */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Motivo do retorno:</p>
                    <div className="rounded-md bg-muted p-3 border">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {pedido?.motivo_backlog || "Sem justificativa registrada"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso */}
              <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  💡 Esta ordem possui prioridade máxima e deve ser tratada com urgência.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
