import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PackageCheck, Loader2, Calendar } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { useInstalacoesCadastradas, InstalacaoCadastrada } from "@/hooks/useInstalacoesCadastradas";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ConfirmarCarregamentoInstalacaoSheetProps {
  instalacao: InstalacaoCadastrada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfirmarCarregamentoInstalacaoSheet({
  instalacao,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmarCarregamentoInstalacaoSheetProps) {
  const { linhas, isLoading } = usePedidoLinhas(instalacao?.pedido_id || "");
  const { concluirInstalacao } = useInstalacoesCadastradas();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataCarregamento, setDataCarregamento] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const totalLinhas = linhas?.length || 0;

  const handleConcluir = async () => {
    console.log('[Carregamento Instalação] Iniciando conclusão...');
    
    if (totalLinhas === 0) {
      toast.error("Nenhum item encontrado no pedido");
      return;
    }

    if (!dataCarregamento) {
      toast.error("Informe a data de carregamento");
      return;
    }

    if (!instalacao?.id) return;

    setIsSubmitting(true);

    try {
      console.log('[Carregamento Instalação] Salvando data no pedido...');
      // Salvar data de carregamento no pedido
      const { error: updateError } = await supabase
        .from("pedidos_producao")
        .update({ data_carregamento: dataCarregamento })
        .eq("id", instalacao.pedido_id);

      if (updateError) throw updateError;

      console.log('[Carregamento Instalação] Chamando concluirInstalacao...');
      // Concluir a instalação e avançar o pedido
      const success = await concluirInstalacao(instalacao.id);
      
      if (!success) {
        throw new Error('Falha ao concluir instalação');
      }

      console.log('[Carregamento Instalação] Sucesso! Fechando modal...');
      toast.success("Carregamento confirmado e pedido finalizado");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[Carregamento Instalação] Erro:', error);
      toast.error(error.message || "Erro ao confirmar carregamento");
      setIsSubmitting(false);
    }
  };

  if (!instalacao) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="font-medium">Concluindo carregamento...</p>
              <p className="text-sm text-muted-foreground">
                Finalizando pedido e registrando conclusão
              </p>
            </div>
          </div>
        )}
        
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Confirmar Carregamento
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{instalacao.nome_cliente}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-medium">{instalacao.pedido?.numero_pedido || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de itens:</span>
              <span className="font-medium">{totalLinhas}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="data-carregamento" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Carregamento *
            </Label>
            <Input
              id="data-carregamento"
              type="date"
              value={dataCarregamento}
              onChange={(e) => setDataCarregamento(e.target.value)}
              required
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Itens do pedido:
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : linhas && linhas.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {linhas.map((linha, index) => (
                    <div
                      key={linha.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {index + 1}. {linha.nome_produto || linha.descricao_produto || "Item"}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Qtd: {linha.quantidade || 1}</span>
                          {linha.tamanho && <span>Tamanho: {linha.tamanho}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item encontrado neste pedido
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConcluir}
              disabled={!dataCarregamento || isSubmitting || totalLinhas === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : (
                <>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Concluir Carregamento
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
