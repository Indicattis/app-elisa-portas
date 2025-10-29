import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowRight, AlertCircle } from "lucide-react";
import { EtapaPedido, ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { usePedidoEtapaCheckboxes } from "@/hooks/usePedidoEtapaCheckboxes";
import { PedidoLinhasEditor } from "./PedidoLinhasEditor";

interface AcaoEtapaModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvancar: (pedidoId: string) => void;
}

export function AcaoEtapaModal({ pedido, open, onOpenChange, onAvancar }: AcaoEtapaModalProps) {
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const isAberto = etapaAtual === 'aberto';
  const proximaEtapa = getProximaEtapa(etapaAtual);
  
  // Para pedido aberto: gerenciar linhas
  const { linhas = [], isLoading: isLoadingLinhas, adicionarLinha, removerLinha } = usePedidoLinhas(pedido.id);
  
  // Para outras etapas: gerenciar checkboxes
  const { 
    checkboxes, 
    atualizarCheckbox, 
    todosObrigatoriosMarcados,
    isLoading: isLoadingCheckboxes 
  } = usePedidoEtapaCheckboxes(pedido.id, etapaAtual);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmar = async () => {
    setIsSubmitting(true);
    try {
      await onAvancar(pedido.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao avançar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = isAberto ? linhas.length > 0 : todosObrigatoriosMarcados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isAberto 
              ? 'Preparar Pedido para Produção' 
              : `Avançar para ${proximaEtapa ? ETAPAS_CONFIG[proximaEtapa].label : ''}`
            }
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-1">
          {isAberto ? (
            // Renderizar editor de linhas
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Adicione os produtos deste pedido antes de iniciar a produção
                </AlertDescription>
              </Alert>
              
              {isLoadingLinhas ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : (
                <PedidoLinhasEditor
                  linhas={linhas}
                  isReadOnly={false}
                  onAdicionarLinha={adicionarLinha}
                  onRemoverLinha={removerLinha}
                />
              )}
            </div>
          ) : (
            // Renderizar checkboxes da etapa
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Etapa Atual</p>
                  <p className="font-semibold">{ETAPAS_CONFIG[etapaAtual].label}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Etapa</p>
                  <p className="font-semibold">
                    {proximaEtapa ? ETAPAS_CONFIG[proximaEtapa].label : 'Finalizado'}
                  </p>
                </div>
              </div>
              
              {isLoadingCheckboxes ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando ações...
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-base">Ações necessárias:</Label>
                  {checkboxes.map(checkbox => (
                    <div 
                      key={checkbox.id} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={checkbox.id}
                        checked={checkbox.checked}
                        onCheckedChange={(checked) => atualizarCheckbox(checkbox.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={checkbox.id} className="cursor-pointer font-normal">
                          {checkbox.label}
                          {checkbox.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!todosObrigatoriosMarcados && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete todos os itens obrigatórios (*) para avançar
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={!canAdvance || isSubmitting}
          >
            {isSubmitting ? (
              'Processando...'
            ) : isAberto ? (
              linhas.length > 0 ? 'Salvar e Iniciar Produção' : 'Adicione produtos para continuar'
            ) : (
              'Confirmar Avanço'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
