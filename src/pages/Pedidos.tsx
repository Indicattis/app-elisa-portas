import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, LayoutGrid, List } from "lucide-react";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { PedidosDraggableList } from "@/components/pedidos/PedidosDraggableList";
import { ORDEM_ETAPAS, ETAPAS_CONFIG } from "@/types/pedidoEtapa";
import type { EtapaPedido, DirecaoPrioridade } from "@/types/pedidoEtapa";
import { useState, useMemo } from "react";

export default function Pedidos() {
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>('aberto');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const contadores = usePedidosContadores();
  
  const { 
    pedidos, 
    isLoading, 
    moverParaProximaEtapa,
    retrocederEtapa,
    atualizarPrioridade,
    reorganizarPedidos
  } = usePedidosEtapas(etapaAtiva);

  const handleMoverEtapa = async (pedidoId: string) => {
    await moverParaProximaEtapa.mutateAsync(pedidoId);
  };

  const handleRetrocederEtapa = async (pedidoId: string) => {
    await retrocederEtapa.mutateAsync(pedidoId);
  };

  const handleReorganizar = async (atualizacoes: { id: string; prioridade: number }[]) => {
    await reorganizarPedidos.mutateAsync(atualizacoes);
  };

  const handleMoverPrioridade = async (pedidoId: string, direcao: DirecaoPrioridade) => {
    const index = pedidos.findIndex(p => p.id === pedidoId);
    if (index === -1) return;

    const pedidoAtual = pedidos[index];
    
    // Verificar se é um pedido de produção (não uma venda)
    if (!('numero_pedido' in pedidoAtual)) return;

    let novaPrioridade: number;

    if (direcao === 'frente' && index > 0) {
      // Mover para frente: pegar prioridade do anterior + 1
      const anterior = pedidos[index - 1];
      novaPrioridade = ((anterior as any).prioridade_etapa || 0) + 1;
    } else if (direcao === 'tras' && index < pedidos.length - 1) {
      // Mover para trás: pegar prioridade do próximo - 1
      const proximo = pedidos[index + 1];
      novaPrioridade = ((proximo as any).prioridade_etapa || 0) - 1;
    } else {
      return;
    }

    await atualizarPrioridade.mutateAsync({
      pedidoId,
      novaPrioridade
    });
  };

  // Filtrar pedidos baseado na pesquisa
  const pedidosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return pedidos;

    const termo = searchTerm.toLowerCase();
    return pedidos.filter((pedido: any) => {
      const venda = pedido.vendas;
      const clienteNome = venda?.cliente_nome?.toLowerCase() || '';
      const clienteTelefone = venda?.cliente_telefone?.toLowerCase() || '';
      const numeroPedido = pedido.numero_pedido?.toLowerCase() || '';
      
      return (
        clienteNome.includes(termo) ||
        clienteTelefone.includes(termo) ||
        numeroPedido.includes(termo)
      );
    });
  }, [pedidos, searchTerm]);

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Pedidos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhe o progresso dos pedidos por etapa
            </p>
          </div>
        </div>

        {/* Barra de pesquisa e controles */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, telefone ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              size="icon"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              title="Visualização em grade"
              className="h-8 w-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Etapas */}
      <Tabs value={etapaAtiva} onValueChange={(v) => setEtapaAtiva(v as EtapaPedido)}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
          {ORDEM_ETAPAS.map((etapa) => {
            const config = ETAPAS_CONFIG[etapa];
            const count = contadores[etapa] || 0;
            
            return (
              <TabsTrigger
                key={etapa}
                value={etapa}
                className="flex-shrink-0 text-xs sm:text-sm whitespace-nowrap"
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${config.color}`} />
                {config.label}
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ORDEM_ETAPAS.map((etapa) => (
          <TabsContent key={etapa} value={etapa} className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{ETAPAS_CONFIG[etapa].label}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
                    {searchTerm && pedidosFiltrados.length !== pedidos.length && (
                      <span className="ml-1">de {pedidos.length}</span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : pedidosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido nesta etapa'}
                  </div>
                ) : (
                  <PedidosDraggableList
                    pedidos={pedidosFiltrados}
                    etapa={etapa}
                    isAberto={etapa === 'aberto'}
                    viewMode={viewMode}
                    onMoverEtapa={handleMoverEtapa}
                    onRetrocederEtapa={handleRetrocederEtapa}
                    onReorganizar={handleReorganizar}
                    onMoverPrioridade={handleMoverPrioridade}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
