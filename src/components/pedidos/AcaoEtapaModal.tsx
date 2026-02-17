import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertCircle, Package, MapPin, Truck } from "lucide-react";
import { EtapaPedido, ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";
import { usePedidoEtapaCheckboxes } from "@/hooks/usePedidoEtapaCheckboxes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AcaoEtapaModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvancar: (pedidoId: string) => void;
}

export function AcaoEtapaModal({ pedido, open, onOpenChange, onAvancar }: AcaoEtapaModalProps) {
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const proximaEtapa = getProximaEtapa(etapaAtual);
  
  // Gerenciar checkboxes
  const { 
    checkboxes, 
    atualizarCheckbox, 
    todosObrigatoriosMarcados,
    isLoading: isLoadingCheckboxes 
  } = usePedidoEtapaCheckboxes(pedido.id, etapaAtual);

  // Buscar dados da venda para mostrar informações dos produtos
  const { data: vendaData } = useQuery({
    queryKey: ['venda-produtos', pedido.venda_id],
    queryFn: async () => {
      if (!pedido.venda_id) return null;
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          produtos_vendas(*)
        `)
        .eq('id', pedido.venda_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!pedido.venda_id && open
  });

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

  const canAdvance = todosObrigatoriosMarcados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Avançar para {proximaEtapa ? ETAPAS_CONFIG[proximaEtapa].label : ''}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-1">
          {/* Informações da Venda */}
          {vendaData && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Informações do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Produtos */}
                {vendaData.produtos_vendas && vendaData.produtos_vendas.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Produtos:</Label>
                    <div className="mt-1 space-y-2">
                      {vendaData.produtos_vendas.map((produto: any, idx: number) => {
                        const largura = produto.largura;
                        const altura = produto.altura;
                        
                        // Cálculos
                        const pesoDaPorta = largura && altura 
                          ? (((altura * largura * 12) * 2) * 0.3).toFixed(2)
                          : null;
                        
                        const quantidadeMeiaCanas = altura 
                          ? Math.ceil(altura / 0.076)
                          : null;
                        
                        return (
                          <div key={idx} className="text-sm p-2 bg-muted/30 rounded space-y-1">
                            <div className="font-medium">{produto.descricao || 'Produto'}</div>
                            {(largura && altura) && (
                              <div className="text-muted-foreground text-xs">
                                Medidas: {Number(largura).toFixed(2)}m x {Number(altura).toFixed(2)}m
                              </div>
                            )}
                            {produto.quantidade > 1 && (
                              <div className="text-muted-foreground text-xs">
                                Quantidade: {produto.quantidade}
                              </div>
                            )}
                            
                            {/* Cálculos */}
                            {pesoDaPorta && (
                              <div className="text-muted-foreground text-xs">
                                Peso da porta: {pesoDaPorta} kg
                              </div>
                            )}
                            {quantidadeMeiaCanas && (
                              <div className="text-muted-foreground text-xs">
                                Meia canas necessárias: {quantidadeMeiaCanas} unidades
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tipo de Entrega */}
                {pedido.modalidade_instalacao && (
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Modalidade:</Label>
                      <div className="text-sm">
                        {pedido.modalidade_instalacao === 'instalacao_elisa' && 'Instalação Elisa'}
                        {pedido.modalidade_instalacao === 'autorizado_elisa' && 'Autorizado Elisa'}
                        {pedido.modalidade_instalacao === 'sem_instalacao' && 'Sem Instalação'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {(pedido.endereco_cidade || pedido.endereco_estado || pedido.endereco_rua) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Endereço:</Label>
                      <div className="text-sm">
                        {pedido.endereco_rua && <div>{pedido.endereco_rua}{pedido.endereco_numero ? `, ${pedido.endereco_numero}` : ''}</div>}
                        {pedido.endereco_cidade && pedido.endereco_estado && (
                          <div>{pedido.endereco_cidade}, {pedido.endereco_estado}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Checkboxes da etapa */}
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
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={!canAdvance || isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Avanço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
