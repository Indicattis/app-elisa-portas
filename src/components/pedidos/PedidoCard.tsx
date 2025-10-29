import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Eye, Package, ChevronUp, ChevronDown, GripVertical, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PedidoDetalhesSheet } from "./PedidoDetalhesSheet";
import { AcaoEtapaModal } from "./AcaoEtapaModal";
import { RetrocederEtapaModal } from "./RetrocederEtapaModal";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa, getEtapaAnterior } from "@/types/pedidoEtapa";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PedidoCardProps {
  pedido: any;
  onMoverEtapa?: (pedidoId: string) => void;
  onRetrocederEtapa?: (pedidoId: string) => void;
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
  onRetrocederEtapa,
  onMoverPrioridade,
  isAberto = false,
  isDragging = false,
  dragHandleProps,
  posicao,
  total
}: PedidoCardProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showAcaoEtapa, setShowAcaoEtapa] = useState(false);
  const [showRetrocederEtapa, setShowRetrocederEtapa] = useState(false);
  const { isAdmin } = useAuth();

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
  const etapaAnterior = etapaAtual ? getEtapaAnterior(etapaAtual) : null;

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
        <CardContent className="pt-3 pb-2 space-y-2.5">
          {/* Header compacto com controles */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-1">
              {dragHandleProps && (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              {config && (
                <Badge className={`${config.color} text-white text-[10px] px-1.5 py-0.5`}>
                  {config.label}
                </Badge>
              )}
            </div>
            
            {/* Controles compactos */}
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDetalhes(true)}
                title="Ver detalhes"
                className="h-6 w-6"
              >
                <Eye className="h-3 w-3" />
              </Button>
              
              {onMoverPrioridade && posicao && total && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={posicao === 1}
                    onClick={() => onMoverPrioridade(pedido.id, 'frente')}
                    title="Aumentar prioridade"
                    className="h-6 w-6"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={posicao === total}
                    onClick={() => onMoverPrioridade(pedido.id, 'tras')}
                    title="Diminuir prioridade"
                    className="h-6 w-6"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              {isAdmin && etapaAnterior && onRetrocederEtapa && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShowRetrocederEtapa(true)}
                  title="Retroceder para etapa anterior"
                  className="h-6 w-6"
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              )}
              
              {posicao && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 font-semibold ml-0.5", getBadgeColor())}>
                  #{posicao}
                </Badge>
              )}
            </div>
          </div>

          {/* Informações do cliente com background */}
          <div className="bg-muted/30 rounded-md p-2 -mx-2">
            <h3 className="font-semibold text-xs truncate">{venda?.cliente_nome}</h3>
            <p className="text-[10px] text-muted-foreground">{venda?.cliente_telefone}</p>
          </div>

          {/* Status das Linhas do Pedido */}
          {isAberto && (
            <div className="flex items-center gap-2 -mx-2 px-2">
              {temLinhas ? (
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {linhasCount} {linhasCount === 1 ? 'linha' : 'linhas'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Sem linhas
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

        <CardFooter className="pt-0 pb-3 gap-2">
          {proximaEtapa && etapaAtual !== 'finalizado' && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowAcaoEtapa(true)}
            >
              <ArrowRight className="h-3.5 w-3.5 mr-2" />
              {isAberto ? 'Preparar Pedido' : `Avançar para ${ETAPAS_CONFIG[proximaEtapa].label}`}
            </Button>
          )}
        </CardFooter>
      </Card>

      <PedidoDetalhesSheet
        pedido={pedido}
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
      />

      <AcaoEtapaModal
        pedido={pedido}
        open={showAcaoEtapa}
        onOpenChange={setShowAcaoEtapa}
        onAvancar={onMoverEtapa || (() => {})}
      />

      <RetrocederEtapaModal
        pedido={pedido}
        open={showRetrocederEtapa}
        onOpenChange={setShowRetrocederEtapa}
        onConfirmar={onRetrocederEtapa || (() => {})}
      />
    </>
  );
}
