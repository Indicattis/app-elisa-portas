import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";
import type { EtapaPedido, PedidoCheckbox } from "@/types/pedidoEtapa";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PedidoEtapaCheckboxesProps {
  pedidoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PedidoEtapaCheckboxes({
  pedidoId,
  open,
  onOpenChange,
}: PedidoEtapaCheckboxesProps) {
  const [etapaAtual, setEtapaAtual] = useState<any>(null);
  const [pedido, setPedido] = useState<any>(null);
  const { atualizarCheckbox, moverParaProximaEtapa, getEtapaAtual } = usePedidosEtapas();

  useEffect(() => {
    if (open && pedidoId) {
      loadData();
    }
  }, [open, pedidoId]);

  const loadData = async () => {
    // Buscar pedido
    const { data: pedidoData } = await supabase
      .from('pedidos_producao')
      .select(`
        *,
        vendas:venda_id (
          cliente_nome,
          cliente_telefone,
          valor_venda
        )
      `)
      .eq('id', pedidoId)
      .single();

    setPedido(pedidoData);

    // Buscar etapa atual
    const etapa = await getEtapaAtual(pedidoId);
    setEtapaAtual(etapa);
  };

  const handleCheckboxChange = async (checkboxId: string) => {
    await atualizarCheckbox.mutateAsync({ pedidoId, checkboxId });
    loadData(); // Recarregar dados
  };

  const handleMoverEtapa = async () => {
    await moverParaProximaEtapa.mutateAsync({ pedidoId });
    onOpenChange(false);
  };

  if (!pedido || !etapaAtual) {
    return null;
  }

  const etapa = pedido.etapa_atual as EtapaPedido;
  const config = ETAPAS_CONFIG[etapa];
  const proximaEtapa = getProximaEtapa(etapa);
  const checkboxes = etapaAtual.checkboxes as PedidoCheckbox[];

  const checkboxesObrigatorios = checkboxes.filter(cb => cb.required);
  const todosObrigatoriosChecados = checkboxesObrigatorios.every(cb => cb.checked);
  const podeAvancar = todosObrigatoriosChecados && proximaEtapa && etapa !== 'finalizado';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Pedido</SheetTitle>
          <SheetDescription>
            {pedido.numero_pedido}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informações do cliente */}
          <div>
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p className="text-sm">{pedido.vendas?.cliente_nome}</p>
            <p className="text-sm text-muted-foreground">
              {pedido.vendas?.cliente_telefone}
            </p>
          </div>

          <Separator />

          {/* Etapa atual */}
          <div>
            <h3 className="font-semibold mb-3">Etapa Atual</h3>
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Desde {format(new Date(etapaAtual.data_entrada), "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>

          <Separator />

          {/* Checkboxes */}
          {checkboxes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Checklist</h3>
              <div className="space-y-3">
                {checkboxes.map((checkbox) => (
                  <div
                    key={checkbox.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Checkbox
                      id={checkbox.id}
                      checked={checkbox.checked}
                      onCheckedChange={() => handleCheckboxChange(checkbox.id)}
                      disabled={etapa === 'finalizado'}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={checkbox.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {checkbox.label}
                        {checkbox.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </label>
                      {checkbox.checked && checkbox.checked_at && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {format(new Date(checkbox.checked_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de avançar */}
          {podeAvancar && (
            <>
              <Separator />
              <Button
                className="w-full"
                onClick={handleMoverEtapa}
                disabled={moverParaProximaEtapa.isPending}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Avançar para {ETAPAS_CONFIG[proximaEtapa].label}
              </Button>
            </>
          )}

          {!todosObrigatoriosChecados && proximaEtapa && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4" />
              Complete todos os itens obrigatórios (*) para avançar
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
