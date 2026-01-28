import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, Package, RefreshCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

  const regenerarLinhas = useMutation({
    mutationFn: async () => {
      if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem inválida');
      
      const { data, error } = await supabase.rpc('regenerar_linhas_ordem', {
        p_ordem_id: ordem.id,
        p_tipo_ordem: ordem.tipo,
      });
      
      if (error) throw error;
      if (data && !(data as { success: boolean }).success) {
        throw new Error((data as { error?: string }).error || 'Erro desconhecido');
      }
      return data as { success: boolean; linhas_criadas: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      toast({
        title: "Linhas regeneradas",
        description: `${data.linhas_criadas} linhas foram recriadas.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível regenerar as linhas.",
        variant: "destructive",
      });
    },
  });

  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const totalLinhas = linhas.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-zinc-900 border-zinc-800 text-white w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <span className="flex-1">
              {ordem ? `${TIPO_LABELS[ordem.tipo]} #${ordem.numero_ordem}` : 'Ordem'}
            </span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => regenerarLinhas.mutate()}
                    disabled={regenerarLinhas.isPending}
                    className="h-7 w-7"
                  >
                    {regenerarLinhas.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-amber-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerar linhas da ordem</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {ordem?.responsavel && (
              <Avatar className="h-6 w-6 border border-blue-500/30">
                <AvatarImage src={ordem.responsavel.foto_url || undefined} />
                <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-300">
                  {ordem.responsavel.iniciais}
                </AvatarFallback>
              </Avatar>
            )}
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            <div className="flex flex-col gap-1">
              {ordem?.responsavel && (
                <span className="text-xs">Responsável: {ordem.responsavel.nome}</span>
              )}
              {totalLinhas > 0 && (
                <span className="flex items-center gap-2">
                  Progresso: {linhasConcluidas}/{totalLinhas} linhas concluídas
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50">
                    {Math.round((linhasConcluidas / totalLinhas) * 100)}%
                  </span>
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : linhas.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Nenhuma linha encontrada para esta ordem.
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div 
                className="grid gap-2 px-2 py-1.5 text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-700/50"
                style={{ gridTemplateColumns: '24px 1fr 45px 55px 85px' }}
              >
                <span></span>
                <span>Item</span>
                <span className="text-center">Qtd</span>
                <span className="text-center">Tam</span>
                <span className="text-center">Dims</span>
              </div>

              {/* Rows */}
              {linhas.map((linha) => (
                <div
                  key={linha.id}
                  className={cn(
                    "grid gap-2 px-2 py-2 rounded-md items-center transition-all duration-200 border",
                    linha.concluida
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/50"
                  )}
                  style={{ gridTemplateColumns: '24px 1fr 45px 55px 85px' }}
                >
                  <Checkbox
                    checked={linha.concluida}
                    onCheckedChange={(checked) => {
                      marcarLinha.mutate({ linhaId: linha.id, concluida: checked as boolean });
                    }}
                    className="border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  
                  <span className={cn(
                    "text-sm truncate",
                    linha.concluida ? "text-green-300 line-through" : "text-white"
                  )}>
                    {linha.estoque?.nome_produto || linha.item}
                  </span>
                  
                  <span className="text-xs text-zinc-400 text-center">
                    {linha.quantidade}
                  </span>
                  
                  <span className="text-xs text-zinc-400 text-center">
                    {linha.tamanho || '-'}
                  </span>
                  
                  <span className="text-xs text-zinc-400 text-center">
                    {linha.largura && linha.altura 
                      ? `${linha.largura}x${linha.altura}` 
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
