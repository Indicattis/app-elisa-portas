import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Eye, Package, ChevronUp, ChevronDown, GripVertical, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { PedidoDetalhesSheet } from "./PedidoDetalhesSheet";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PedidoCardProps {
  pedido: any;
  onMoverEtapa?: (pedidoId: string) => void;
  onMoverPrioridade?: (pedidoId: string, direcao: 'frente' | 'tras') => void;
  isAberto?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  posicao?: number;
  total?: number;
}

export function PedidoCard({ 
  pedido, 
  onMoverEtapa, 
  onMoverPrioridade,
  isAberto = false,
  isDragging = false,
  dragHandleProps,
  posicao,
  total
}: PedidoCardProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);

  // Buscar quantidade de linhas do pedido
  const { data: linhasCount = 0 } = useQuery({
    queryKey: ['pedido-linhas-count', pedido.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pedido_linhas')
        .select('*', { count: 'exact', head: true })
        .eq('pedido_id', pedido.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Para todos os pedidos (incluindo aberto), buscar dados da venda relacionada
  const venda = pedido.vendas;
  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const config = etapaAtual ? ETAPAS_CONFIG[etapaAtual] : null;
  const proximaEtapa = etapaAtual ? getProximaEtapa(etapaAtual) : null;

  const produtos = venda?.produtos_vendas || [];
  const temLinhas = linhasCount > 0;

  // Badge de posição com cores especiais para top 3
  const getBadgeColor = () => {
    if (!posicao) return "bg-muted text-muted-foreground";
    if (posicao === 1) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
    if (posicao === 2) return "bg-gray-400/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
    if (posicao === 3) return "bg-orange-600/20 text-orange-700 dark:text-orange-400 border-orange-600/50";
    return "bg-muted text-muted-foreground";
  };

  return (
    <>
      <Card className={cn(
        "hover:shadow-md transition-all",
        isDragging && "opacity-50 cursor-grabbing"
      )}>
        <CardContent className="pt-4 space-y-3">
          {/* Header com Badge de etapa e prioridade */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {config && (
                <Badge className={`${config.color} text-white text-xs`}>
                  {config.label}
                </Badge>
              )}
            </div>
            {posicao && (
              <Badge variant="outline" className={cn("text-xs font-semibold", getBadgeColor())}>
                #{posicao}
              </Badge>
            )}
          </div>

          {/* Informações do cliente */}
          <div>
            <h3 className="font-semibold text-sm truncate">{venda?.cliente_nome}</h3>
            <p className="text-xs text-muted-foreground">{venda?.cliente_telefone}</p>
          </div>

          {/* Status das Linhas do Pedido */}
          {isAberto && (
            <div className="flex items-center gap-2">
              {temLinhas ? (
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {linhasCount} {linhasCount === 1 ? 'linha cadastrada' : 'linhas cadastradas'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Sem linhas cadastradas
                </Badge>
              )}
            </div>
          )}

          {/* Produtos */}
          {!isAberto && produtos.length > 0 && (
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

        <CardFooter className="gap-2 pt-0 pb-4 flex-wrap">
          {onMoverPrioridade && posicao && total && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={posicao === 1}
                onClick={() => onMoverPrioridade(pedido.id, 'frente')}
                title="Aumentar prioridade"
                className="h-8 w-8"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={posicao === total}
                onClick={() => onMoverPrioridade(pedido.id, 'tras')}
                title="Diminuir prioridade"
                className="h-8 w-8"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setShowDetalhes(true)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          {proximaEtapa && etapaAtual !== 'finalizado' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onMoverEtapa?.(pedido.id)}
              disabled={isAberto && !temLinhas}
              title={isAberto && !temLinhas ? "Adicione pelo menos uma linha ao pedido para avançar" : ""}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              {isAberto ? 'Iniciar Produção' : 'Avançar'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <PedidoDetalhesSheet
        pedido={pedido}
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
      />
    </>
  );
}
