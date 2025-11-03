import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Package, X, Paintbrush, Truck, Hammer } from "lucide-react";
import { determinarFluxograma, getIndiceEtapaAtual } from "@/utils/pedidoFluxograma";
import type { EtapaPedido } from "@/types/pedidoEtapa";

interface PedidoFluxogramaMapProps {
  pedidoSelecionado: any;
  onClose?: () => void;
}

export function PedidoFluxogramaMap({ pedidoSelecionado, onClose }: PedidoFluxogramaMapProps) {
  if (!pedidoSelecionado) return null;

  const fluxograma = determinarFluxograma(pedidoSelecionado);
  const etapaAtual = pedidoSelecionado.etapa_atual as EtapaPedido;
  const indiceAtual = getIndiceEtapaAtual(fluxograma, etapaAtual);

  // Extrair informações do pedido
  const vendaData = Array.isArray(pedidoSelecionado.vendas) 
    ? pedidoSelecionado.vendas[0] 
    : pedidoSelecionado.vendas;
  
  const produtos = vendaData?.produtos_vendas || [];
  const temPintura = produtos.some((p: any) => p.valor_pintura > 0);
  const tipoEntrega = vendaData?.tipo_entrega;

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Fluxograma do Pedido
            {pedidoSelecionado.numero_pedido && (
              <span className="text-sm font-normal text-muted-foreground">
                - {pedidoSelecionado.numero_pedido}
              </span>
            )}
          </CardTitle>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Características do pedido */}
        <div className="flex items-center gap-2 mt-2">
          {temPintura && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/50">
              <Paintbrush className="h-3 w-3 mr-1" />
              Com Pintura
            </Badge>
          )}
          
          {tipoEntrega === 'instalacao' && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/50">
              <Hammer className="h-3 w-3 mr-1" />
              Instalação
            </Badge>
          )}
          
          {tipoEntrega === 'entrega' && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
              <Truck className="h-3 w-3 mr-1" />
              Entrega
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Desktop: Layout horizontal */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-center">
          {fluxograma.map((etapa, index) => (
            <div key={etapa.id} className="flex items-center gap-2">
              <div className={cn(
                "relative transition-all duration-300",
                index === indiceAtual && "scale-110"
              )}>
                <Badge 
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all",
                    etapa.color,
                    "text-white",
                    index === indiceAtual && "ring-4 ring-primary/30 shadow-lg",
                    index < indiceAtual && "opacity-60",
                    index > indiceAtual && "opacity-40"
                  )}
                >
                  {etapa.label}
                </Badge>
                {index === indiceAtual && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary whitespace-nowrap">
                    ▲ Atual
                  </div>
                )}
              </div>
              
              {index < fluxograma.length - 1 && (
                <ArrowRight className={cn(
                  "h-5 w-5 flex-shrink-0 transition-all",
                  index < indiceAtual ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Layout vertical */}
        <div className="flex md:hidden flex-col gap-2">
          {fluxograma.map((etapa, index) => (
            <div key={etapa.id} className="flex flex-col gap-2">
              <div className={cn(
                "relative transition-all duration-300",
                index === indiceAtual && "scale-105"
              )}>
                <Badge 
                  className={cn(
                    "w-full justify-center px-4 py-3 text-sm font-medium transition-all",
                    etapa.color,
                    "text-white",
                    index === indiceAtual && "ring-4 ring-primary/30 shadow-lg",
                    index < indiceAtual && "opacity-60",
                    index > indiceAtual && "opacity-40"
                  )}
                >
                  {etapa.label}
                  {index === indiceAtual && (
                    <span className="ml-2 text-xs">← Atual</span>
                  )}
                </Badge>
              </div>
              
              {index < fluxograma.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className={cn(
                    "h-5 w-5 rotate-90 transition-all",
                    index < indiceAtual ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          <p className="flex items-center justify-between">
            <span>Cliente: <span className="font-medium text-foreground">{vendaData?.cliente_nome}</span></span>
            <span>Etapas concluídas: <span className="font-medium text-foreground">{indiceAtual} de {fluxograma.length - 1}</span></span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
