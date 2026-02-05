import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronRight, CheckCircle2, Factory, ShieldCheck, Truck, Hammer, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePedidosAprovacaoCEO, PedidoAprovacao } from '@/hooks/usePedidosAprovacaoCEO';
import { PedidoDetalhesSheet } from '@/components/pedidos/PedidoDetalhesSheet';
import { CronometroEtapaBadge } from '@/components/pedidos/CronometroEtapaBadge';
import { cn } from '@/lib/utils';

export default function AprovacoesProducao() {
  const navigate = useNavigate();
  const { pedidos, isLoading, refetch, aprovarPedido } = usePedidosAprovacaoCEO();
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const handleAprovar = async (pedidoId: string) => {
    await aprovarPedido.mutateAsync(pedidoId);
  };

  const handleOpenDetalhes = (pedido: PedidoAprovacao) => {
    setSelectedPedido(pedido.pedidoCompleto);
    setShowDetalhes(true);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header fixo */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/direcao/aprovacoes')}
                className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Factory className="w-5 h-5 text-orange-500" />
                  Aprovações Fábrica
                </h1>
                <p className="text-xs text-muted-foreground">
                  {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} aguardando
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="p-4 space-y-4 pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500/50 mb-4" />
              <h2 className="text-lg font-medium">Tudo em dia!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Não há pedidos aguardando aprovação
              </p>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-card rounded-xl border shadow-sm overflow-hidden"
              >
                {/* Header do card - Novo Layout */}
                <button
                  onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    {/* Linha 1: Nome do cliente */}
                    <p className="font-semibold text-base truncate">{pedido.cliente_nome}</p>
                    
                    {/* Linha 2: Número + Badges P/G + Ícone tipo + Cores */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-orange-500 font-mono">{pedido.numero_pedido}</span>
                      
                      {/* Badges P e G */}
                      {pedido.portasInfo.length > 0 && (
                        <div className="flex gap-0.5">
                          {pedido.portasInfo.map((p, idx) => (
                            <Badge 
                              key={idx}
                              className={cn(
                                "text-[9px] h-4 px-1.5 font-bold rounded-sm",
                                p.tamanho === 'P' 
                                  ? "bg-orange-500 text-white hover:bg-orange-500" 
                                  : "bg-blue-500 text-white hover:bg-blue-500"
                              )}
                            >
                              {p.tamanho}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Ícone tipo entrega */}
                      {pedido.tipo_entrega === 'instalacao' && (
                        <Hammer className="w-4 h-4 text-blue-500" />
                      )}
                      {pedido.tipo_entrega === 'entrega' && (
                        <Truck className="w-4 h-4 text-green-500" />
                      )}
                      {pedido.tipo_entrega === 'manutencao' && (
                        <Wrench className="w-4 h-4 text-purple-500" />
                      )}
                      
                      {/* Cores */}
                      {pedido.cores.length > 0 && (
                        <div className="flex gap-1">
                          {pedido.cores.slice(0, 3).map((cor, idx) => (
                            <div 
                              key={idx}
                              className="w-4 h-4 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: cor.codigo_hex }}
                              title={cor.nome}
                            />
                          ))}
                          {pedido.cores.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{pedido.cores.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Linha 3: Cronômetro + Data */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <CronometroEtapaBadge dataEntrada={pedido.data_entrada_etapa} />
                      <span>{format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${
                      expandedPedido === pedido.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>

                {/* Detalhes expandidos */}
                {expandedPedido === pedido.id && (
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    {/* Botões de ação */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAprovar(pedido.id)}
                        disabled={aprovarPedido.isPending}
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 
                                   hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                      >
                        {aprovarPedido.isPending ? (
                          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 mr-2" />
                        )}
                        Aprovar e Enviar para Produção
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleOpenDetalhes(pedido)}
                        className="w-full"
                      >
                        Ver Detalhes do Pedido
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Downbar de detalhes */}
        {selectedPedido && (
          <PedidoDetalhesSheet 
            pedido={selectedPedido} 
            open={showDetalhes} 
            onOpenChange={setShowDetalhes} 
          />
        )}
      </div>
    </TooltipProvider>
  );
}
