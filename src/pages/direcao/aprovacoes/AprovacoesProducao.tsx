import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronRight, CheckCircle2, Clock, Factory, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { usePedidosAprovacaoCEO, PedidoAprovacao } from '@/hooks/usePedidosAprovacaoCEO';
import { PedidoDetalhesSheet } from '@/components/pedidos/PedidoDetalhesSheet';

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
              {/* Header do card */}
              <button
                onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-orange-500">
                      {pedido.numero_pedido}
                    </span>
                  </div>
                  <p className="font-medium truncate">{pedido.cliente_nome}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="truncate">{pedido.produtos_resumo}</span>
                  </div>
                </div>
                <ChevronRight 
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
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
  );
}
