import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheck, Loader2, Truck } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

interface CarregamentoDownbarProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir: (params: { id: string; observacoes?: string }) => Promise<any>;
  onSuccess: () => void;
}

export function CarregamentoDownbar({
  ordem,
  open,
  onOpenChange,
  onConcluir,
  onSuccess,
}: CarregamentoDownbarProps) {
  const { linhas, isLoading, atualizarCheckbox } = usePedidoLinhas(ordem?.pedido_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const hasUncheckedRef = useRef(false);

  // Desmarcar todos os itens APENAS ao abrir pela primeira vez
  useEffect(() => {
    if (open && ordem?.pedido_id && linhas && linhas.length > 0 && !hasUncheckedRef.current) {
      hasUncheckedRef.current = true;
      const desmarcarTodos = async () => {
        try {
          for (const linha of linhas) {
            if (linha.check_coleta) {
              await atualizarCheckbox({
                linhaId: linha.id,
                campo: "check_coleta",
                valor: false,
              });
            }
          }
          // Recarregar as linhas após desmarcar
          queryClient.invalidateQueries({ queryKey: ["pedido-linhas", ordem.pedido_id] });
        } catch (error) {
          console.error("Erro ao desmarcar itens:", error);
        }
      };
      desmarcarTodos();
    }
    
    // Resetar a flag quando fechar a downbar
    if (!open) {
      hasUncheckedRef.current = false;
    }
  }, [open, ordem?.pedido_id, linhas, atualizarCheckbox, queryClient]);

  const todasMarcadas = linhas?.every((linha) => linha.check_coleta) || false;
  const totalLinhas = linhas?.length || 0;
  const linhasMarcadas = linhas?.filter((linha) => linha.check_coleta).length || 0;

  const handleCheckboxChange = async (linhaId: string, checked: boolean) => {
    try {
      await atualizarCheckbox({
        linhaId,
        campo: "check_coleta",
        valor: checked,
      });
    } catch (error) {
      console.error("Erro ao atualizar checkbox:", error);
      toast.error("Erro ao marcar item");
    }
  };

  const handleConcluir = async () => {
    console.log('[Carregamento] Iniciando conclusão...');
    
    if (!todasMarcadas) {
      toast.error("Todos os itens devem ser marcados antes de concluir");
      return;
    }

    if (!ordem?.id) return;

    setIsSubmitting(true);

    try {
      console.log('[Carregamento] Concluindo ordem de carregamento...');
      await onConcluir({
        id: ordem.id,
        observacoes: "Carregamento concluído via interface de produção"
      });

      console.log('[Carregamento] Sucesso! Fechando modal...');
      toast.success("Carregamento concluído com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[Carregamento] Erro:', error);
      toast.error(error.message || "Erro ao concluir carregamento");
      setIsSubmitting(false);
    }
  };

  if (!ordem) return null;

  const Icon = ordem.tipo_carregamento === 'elisa' ? Truck : PackageCheck;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl max-w-[700px] mx-auto">
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-t-2xl">
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
            <Icon className="h-5 w-5" />
            Confirmar Carregamento - {ordem.tipo_carregamento === 'elisa' ? 'Elisa' : 'Autorizado'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 h-[calc(100%-80px)]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{ordem.nome_cliente}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-medium">{ordem.pedido?.numero_pedido || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso:</span>
              <span className="font-medium">
                {linhasMarcadas} de {totalLinhas} itens
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-medium">
              Marque os itens conforme forem carregados:
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : linhas && linhas.length > 0 ? (
              <ScrollArea className="h-[calc(85vh-350px)]">
                <div className="space-y-3 pr-4">
                  {linhas.map((linha, index) => (
                    <div
                      key={linha.id}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={linha.check_coleta || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(linha.id, checked as boolean)
                        }
                        id={`linha-${linha.id}`}
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`linha-${linha.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {index + 1}. {linha.nome_produto || linha.descricao_produto || "Item"}
                        </label>
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

          {!todasMarcadas && totalLinhas > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning p-3">
              <span className="text-warning">⚠</span>
              <p className="text-sm text-warning">
                Marque todos os itens antes de concluir o carregamento
              </p>
            </div>
          )}

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
              disabled={!todasMarcadas || isSubmitting || totalLinhas === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : (
                <>
                  <Icon className="mr-2 h-4 w-4" />
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
