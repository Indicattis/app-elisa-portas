import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package } from "lucide-react";
import { useLinhasOrdem, LinhaOrdem } from "@/hooks/useLinhasOrdem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { OrdemStatus, TipoOrdem } from "@/hooks/useOrdensPorPedido";

interface OrdemLinhasSheetProps {
  ordem: OrdemStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};

export function OrdemLinhasSheet({ ordem, open, onOpenChange }: OrdemLinhasSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: linhas = [], isLoading } = useLinhasOrdem(
    ordem?.id || null, 
    ordem?.tipo || null
  );

  const marcarLinha = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('linhas_ordens')
        .update({
          concluida,
          concluida_em: concluida ? new Date().toISOString() : null,
          concluida_por: concluida ? user?.id : null,
        })
        .eq('id', linhaId);

      if (error) throw error;
      return { linhaId, concluida };
    },
    onMutate: async ({ linhaId, concluida }) => {
      await queryClient.cancelQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });

      const previousLinhas = queryClient.getQueryData<LinhaOrdem[]>(['linhas-ordem', ordem?.id, ordem?.tipo]);

      queryClient.setQueryData<LinhaOrdem[]>(['linhas-ordem', ordem?.id, ordem?.tipo], (old) =>
        old?.map(l => l.id === linhaId ? { ...l, concluida } : l)
      );

      return { previousLinhas };
    },
    onError: (error, _, context) => {
      if (context?.previousLinhas) {
        queryClient.setQueryData(['linhas-ordem', ordem?.id, ordem?.tipo], context.previousLinhas);
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      toast({ title: "Atualizado" });
    },
  });

  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const totalLinhas = linhas.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-zinc-900 border-zinc-800 text-white w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            {ordem ? `${TIPO_LABELS[ordem.tipo]} #${ordem.numero_ordem}` : 'Ordem'}
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            {totalLinhas > 0 && (
              <span className="flex items-center gap-2">
                Progresso: {linhasConcluidas}/{totalLinhas} linhas concluídas
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50">
                  {Math.round((linhasConcluidas / totalLinhas) * 100)}%
                </span>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : linhas.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Nenhuma linha encontrada para esta ordem.
            </div>
          ) : (
            linhas.map((linha) => (
              <div
                key={linha.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200",
                  linha.concluida
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-zinc-800/50 border-zinc-700/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={linha.concluida}
                    onCheckedChange={(checked) => {
                      marcarLinha.mutate({ linhaId: linha.id, concluida: checked as boolean });
                    }}
                    className="mt-1 border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-sm",
                      linha.concluida ? "text-green-300 line-through" : "text-white"
                    )}>
                      {linha.estoque?.nome_produto || linha.item}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-zinc-700/50">
                        Qtd: {linha.quantidade} {linha.estoque?.unidade || ''}
                      </span>
                      {linha.tamanho && (
                        <span className="px-2 py-0.5 rounded bg-zinc-700/50">
                          Tam: {linha.tamanho}
                        </span>
                      )}
                      {linha.largura && linha.altura && (
                        <span className="px-2 py-0.5 rounded bg-zinc-700/50">
                          {linha.largura}x{linha.altura}mm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
