import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EtapaPedido, PedidoCheckbox } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";
import { toast } from "@/hooks/use-toast";

interface AvancarEtapaModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (pedidoId: string) => void;
}

export function AvancarEtapaModal({
  pedido,
  open,
  onOpenChange,
  onConfirmar
}: AvancarEtapaModalProps) {
  const queryClient = useQueryClient();
  const [checkboxes, setCheckboxes] = useState<PedidoCheckbox[]>([]);
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const proximaEtapa = getProximaEtapa(etapaAtual);
  const configAtual = ETAPAS_CONFIG[etapaAtual];
  const configProxima = proximaEtapa ? ETAPAS_CONFIG[proximaEtapa] : null;

  // Buscar checkboxes do pedido
  const { data: etapaData, isLoading } = useQuery({
    queryKey: ['pedido-etapa-checkboxes', pedido.id, etapaAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_etapas')
        .select('checkboxes')
        .eq('pedido_id', pedido.id)
        .eq('etapa', etapaAtual)
        .maybeSingle();
      
      if (error) throw error;
      
      // Se não existir etapa, criar com checkboxes default
      if (!data) {
        const defaultCheckboxes = configAtual.checkboxes;
        const { data: newEtapa, error: insertError } = await supabase
          .from('pedidos_etapas')
          .insert({
            pedido_id: pedido.id,
            etapa: etapaAtual,
            checkboxes: defaultCheckboxes
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newEtapa;
      }
      
      return data;
    },
    enabled: open && !!etapaAtual
  });

  // Atualizar checkboxes locais quando dados carregarem
  useEffect(() => {
    if (etapaData?.checkboxes) {
      setCheckboxes(etapaData.checkboxes as unknown as PedidoCheckbox[]);
    }
  }, [etapaData]);

  // Mutation para atualizar checkboxes
  const { mutate: atualizarCheckbox } = useMutation({
    mutationFn: async ({ checkboxId, checked }: { checkboxId: string; checked: boolean }) => {
      const updatedCheckboxes = checkboxes.map(cb =>
        cb.id === checkboxId ? { ...cb, checked } : cb
      );

      const { error } = await supabase
        .from('pedidos_etapas')
        .update({ checkboxes: updatedCheckboxes as any })
        .eq('pedido_id', pedido.id)
        .eq('etapa', etapaAtual);

      if (error) throw error;
      return updatedCheckboxes;
    },
    onSuccess: (updatedCheckboxes) => {
      setCheckboxes(updatedCheckboxes);
      queryClient.invalidateQueries({ queryKey: ['pedido-etapa-checkboxes', pedido.id, etapaAtual] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar checkbox",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Validar se pode avançar
  const todosObrigatoriosMarcados = checkboxes
    .filter(cb => cb.required)
    .every(cb => cb.checked);

  const handleConfirmar = () => {
    if (todosObrigatoriosMarcados) {
      onConfirmar(pedido.id);
      onOpenChange(false);
    } else {
      toast({
        title: "Ação necessária",
        description: "Complete todos os campos obrigatórios antes de avançar",
        variant: "destructive"
      });
    }
  };

  const handleToggleCheckbox = (checkboxId: string, currentChecked: boolean) => {
    atualizarCheckbox({ checkboxId, checked: !currentChecked });
  };

  if (!proximaEtapa || !configProxima) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Avançar Pedido
          </DialogTitle>
          <DialogDescription>
            {pedido.numero_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Etapas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Etapa Atual:</span>
              <Badge className={`${configAtual.color} text-white`}>
                {configAtual.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Próxima Etapa:</span>
              <Badge className={`${configProxima.color} text-white`}>
                {configProxima.label}
              </Badge>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-primary" />
              Ações necessárias para avançar:
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {checkboxes.map((checkbox) => (
                  <div
                    key={checkbox.id}
                    className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={checkbox.id}
                      checked={checkbox.checked}
                      onCheckedChange={() => handleToggleCheckbox(checkbox.id, checkbox.checked)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={checkbox.id}
                      className="text-sm flex-1 cursor-pointer select-none"
                    >
                      {checkbox.label}
                      {checkbox.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              * Campo obrigatório
            </p>
          </div>

          {/* Aviso se faltam obrigatórios */}
          {!todosObrigatoriosMarcados && (
            <div className="flex items-center gap-2 rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-xs text-orange-700 dark:text-orange-300">
                Complete todos os campos obrigatórios para avançar
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={!todosObrigatoriosMarcados}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Avançar Etapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
