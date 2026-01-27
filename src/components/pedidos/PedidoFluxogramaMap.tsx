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
  variant?: 'card' | 'inline';
}

export function PedidoFluxogramaMap({ pedidoSelecionado, onClose, variant = 'card' }: PedidoFluxogramaMapProps) {
  // Se não há pedido selecionado, exibe apenas o título
  if (!pedidoSelecionado) {
    if (variant === 'inline') return null;
    
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

  const content = (
    <>
      {/* Desktop: Layout horizontal */}
      <div className="hidden md:flex items-center gap-1.5 justify-center flex-wrap">
        {fluxograma.map((etapa, index) => (
          <div key={etapa.id} className="flex items-center gap-1.5">
            <Badge 
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-all",
                etapa.color,
                "text-white",
                index === indiceAtual && "ring-2 ring-primary/50 scale-105",
                index < indiceAtual && "opacity-60",
                index > indiceAtual && "opacity-30"
              )}
            >
              {etapa.label}
            </Badge>
            
            {index < fluxograma.length - 1 && (
              <ArrowRight className={cn(
                "h-4 w-4 flex-shrink-0",
                variant === 'inline' ? "text-white/40" : "",
                index < indiceAtual ? "text-primary" : "text-muted-foreground/50"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Layout horizontal scrollable */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
        {fluxograma.map((etapa, index) => (
          <div key={etapa.id} className="flex items-center gap-1.5 flex-shrink-0">
            <Badge 
              className={cn(
                "px-2 py-1 text-[10px] font-medium transition-all whitespace-nowrap",
                etapa.color,
                "text-white",
                index === indiceAtual && "ring-2 ring-primary/50",
                index < indiceAtual && "opacity-60",
                index > indiceAtual && "opacity-30"
              )}
            >
              {etapa.label}
            </Badge>
            
            {index < fluxograma.length - 1 && (
              <ArrowRight className={cn(
                "h-3 w-3 flex-shrink-0",
                variant === 'inline' ? "text-white/40" : "",
                index < indiceAtual ? "text-primary" : "text-muted-foreground/50"
              )} />
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <Card className="mb-4 border border-border/50">
      <CardContent className="p-3">
        {content}
      </CardContent>
    </Card>
  );
}
