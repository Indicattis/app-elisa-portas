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
  // Se não há pedido selecionado, exibe apenas o título
  if (!pedidoSelecionado) {
    return (
      <Card className="mb-4 border border-border/50">
        <CardContent className="p-3">
          <div className="text-center text-sm text-muted-foreground">
            Passe o mouse sobre um pedido para ver seu fluxograma
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="mb-4 border border-border/50">
      <CardContent className="p-3">
        {/* Desktop: Layout horizontal */}
        <div className="hidden md:flex items-center gap-1.5 justify-center">
          {fluxograma.map((etapa, index) => (
            <div key={etapa.id} className="flex items-center gap-1.5">
              <Badge 
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-all",
                  etapa.color,
                  "text-white",
                  index === indiceAtual && "ring-2 ring-primary/50",
                  index < indiceAtual && "opacity-50",
                  index > indiceAtual && "opacity-30"
                )}
              >
                {etapa.label}
              </Badge>
              
              {index < fluxograma.length - 1 && (
                <ArrowRight className={cn(
                  "h-4 w-4 flex-shrink-0",
                  index < indiceAtual ? "text-primary" : "text-muted-foreground/50"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Layout vertical */}
        <div className="flex md:hidden flex-col gap-1.5">
          {fluxograma.map((etapa, index) => (
            <div key={etapa.id} className="flex flex-col gap-1.5">
              <Badge 
                className={cn(
                  "w-full justify-center px-2.5 py-1.5 text-xs font-medium transition-all",
                  etapa.color,
                  "text-white",
                  index === indiceAtual && "ring-2 ring-primary/50",
                  index < indiceAtual && "opacity-50",
                  index > indiceAtual && "opacity-30"
                )}
              >
                {etapa.label}
              </Badge>
              
              {index < fluxograma.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className={cn(
                    "h-4 w-4 rotate-90",
                    index < indiceAtual ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
