import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Eye, Package } from "lucide-react";
import { useState } from "react";
import { PedidoEtapaCheckboxes } from "./PedidoEtapaCheckboxes";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";

interface PedidoCardProps {
  pedido: any;
  onCriarPedido?: (vendaId: string) => void;
  onMoverEtapa?: (pedidoId: string) => void;
  isAberto?: boolean;
}

export function PedidoCard({ pedido, onCriarPedido, onMoverEtapa, isAberto = false }: PedidoCardProps) {
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const venda = isAberto ? pedido : pedido.vendas;
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const config = etapaAtual ? ETAPAS_CONFIG[etapaAtual] : null;
  const proximaEtapa = etapaAtual ? getProximaEtapa(etapaAtual) : null;

  const produtos = venda?.produtos_vendas || [];

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 space-y-3">
          {/* Badge de etapa */}
          {config && (
            <Badge className={`${config.color} text-white text-xs`}>
              {config.label}
            </Badge>
          )}

          {/* Informações do cliente */}
          <div>
            <h3 className="font-semibold text-sm truncate">{venda?.cliente_nome}</h3>
            <p className="text-xs text-muted-foreground">{venda?.cliente_telefone}</p>
          </div>

          {/* Produtos */}
          {produtos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {produtos.slice(0, 2).map((prod: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  <Package className="h-3 w-3 mr-1" />
                  {prod.tipo_produto}
                </Badge>
              ))}
              {produtos.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{produtos.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Valor e Data */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-primary">
              {formatCurrency(venda?.valor_venda || 0)}
            </span>
            <span className="text-muted-foreground">
              {format(new Date(venda?.created_at || Date.now()), "dd/MM/yyyy")}
            </span>
          </div>

          {/* Número do pedido */}
          {!isAberto && pedido.numero_pedido && (
            <div className="text-xs text-muted-foreground">
              {pedido.numero_pedido}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2 pt-0 pb-4">
          {isAberto ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onCriarPedido?.(pedido.id)}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Criar Pedido
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCheckboxes(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Detalhes
              </Button>
              {proximaEtapa && etapaAtual !== 'finalizado' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onMoverEtapa?.(pedido.id)}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Avançar
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {!isAberto && (
        <PedidoEtapaCheckboxes
          pedidoId={pedido.id}
          open={showCheckboxes}
          onOpenChange={setShowCheckboxes}
        />
      )}
    </>
  );
}
