import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheck, Loader2 } from "lucide-react";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Entrega {
  id: string;
  nome_cliente: string;
  pedido_id?: string;
  pedido?: {
    numero_pedido: string;
  };
}

interface ConfirmarCarregamentoSheetProps {
  entrega: Entrega | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfirmarCarregamentoSheet({
  entrega,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmarCarregamentoSheetProps) {
  const { linhas, isLoading, atualizarCheckbox } = usePedidoLinhas(entrega?.pedido_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!todasMarcadas) {
      toast.error("Todos os itens devem ser marcados antes de concluir");
      return;
    }

    setIsSubmitting(true);
    onSuccess();
  };

  if (!entrega) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
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
              <span className="font-medium">{entrega.nome_cliente}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-medium">{entrega.pedido?.numero_pedido || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso:</span>
              <span className="font-medium">
                {linhasMarcadas} de {totalLinhas} itens
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Marque os itens conforme forem carregados:
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
                Marque todos os itens antes de concluir a entrega
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
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Concluir Entrega
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
