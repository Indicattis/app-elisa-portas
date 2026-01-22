import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Clock, CheckCircle, Paintbrush, Truck, Wrench, ArchiveRestore, RefreshCw, HardHat, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { PedidosDraggableList } from "@/components/pedidos/PedidosDraggableList";
import { PedidosFiltrosMinimalista } from "@/components/pedidos/PedidosFiltrosMinimalista";
import type { EtapaPedido, PrioridadeUpdate, DirecaoPrioridade } from "@/types/pedidoEtapa";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { PortasPorEtapa } from "@/components/producao/dashboard/PortasPorEtapa";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

const ETAPA_ICONS: Record<EtapaPedido, any> = {
  aberto: Package,
  em_producao: Clock,
  inspecao_qualidade: CheckCircle,
  aguardando_pintura: Paintbrush,
  aguardando_coleta: Truck,
  aguardando_instalacao: Wrench,
  instalacoes: HardHat,
  correcoes: AlertTriangle,
  finalizado: ArchiveRestore,
};

const ITEMS_PER_PAGE = 25;

export default function PedidosProducaoMinimalista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>("em_producao");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<string>("todos");
  const [corPintura, setCorPintura] = useState<string>("todas");
  const [mostrarProntos, setMostrarProntos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    pedidos, 
    isLoading, 
    moverParaProximaEtapa, 
    retrocederEtapa, 
    reorganizarPedidos, 
    atualizarPrioridade,
    arquivarPedido, 
    deletarPedido 
  } = usePedidosEtapas(etapaAtiva);
  const contadores = usePedidosContadores();

  const handleMoverEtapa = async (
    pedidoId: string, 
    skipCheckboxValidation?: boolean, 
    onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void
  ) => {
    await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation, onProgress });
  };

  const handleRetrocederEtapa = async (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => {
    await retrocederEtapa.mutateAsync({ pedidoId, etapaDestino, motivo });
  };

  const handleReorganizar = async (updates: PrioridadeUpdate[]) => {
    await reorganizarPedidos.mutateAsync(updates);
  };

  const handleMoverPrioridade = async (pedidoId: string, direcao: DirecaoPrioridade) => {
    // Mover para frente = prioridade alta, para trás = prioridade baixa
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const novaPrioridade = direcao === 'frente' 
      ? (pedidos[0]?.prioridade_etapa || 0) + 10 
      : Math.max(0, (pedidos[pedidos.length - 1]?.prioridade_etapa || 0) - 10);
    
    await atualizarPrioridade.mutateAsync({ pedidoId, novaPrioridade });
  };

  const handleArquivar = async (pedidoId: string) => {
    await arquivarPedido.mutateAsync(pedidoId);
  };

  const handleDeletarPedido = async (pedidoId: string) => {
    await deletarPedido.mutateAsync(pedidoId);
  };

  // Filtrar pedidos
  const pedidosFiltrados = useMemo(() => {
    let filtrados = pedidos;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) => {
          const numeroPedido = p.numero_pedido?.toString() || '';
          const clienteNome = p.vendas?.cliente_nome?.toLowerCase() || '';
          return numeroPedido.includes(termo) || clienteNome.includes(termo);
        }
      );
    }

    // Filtro por tipo de entrega
    if (tipoEntrega !== "todos") {
      filtrados = filtrados.filter((p) => p.vendas?.tipo_entrega === tipoEntrega);
    }

    // Filtro por cor de pintura
    if (corPintura !== "todas") {
      filtrados = filtrados.filter((p) => {
        const produtos = (p.vendas as any)?.produtos_vendas as any[] | undefined;
        if (!produtos) return false;
        return produtos.some((prod: any) => prod.cor?.nome === corPintura);
      });
    }

    // Filtro de prontos para avançar (todas ordens finalizadas)
    if (mostrarProntos) {
      filtrados = filtrados.filter((p) => {
        const soldagem = p.ordens_soldagem as any;
        const perfiladeira = p.ordens_perfiladeira as any;
        const separacao = p.ordens_separacao as any;
        const qualidade = (p as any).ordens_qualidade as any;
        const pintura = p.ordens_pintura as any;

        // Verifica se todas as ordens existentes estão finalizadas
        const soldagemOk = !soldagem || soldagem.status === "finalizada";
        const perfiladeiraOk = !perfiladeira || perfiladeira.status === "finalizada";
        const separacaoOk = !separacao || separacao.status === "finalizada";
        const qualidadeOk = !qualidade || qualidade.status === "finalizada";
        const pinturaOk = !pintura || pintura.status === "finalizada";

        return soldagemOk && perfiladeiraOk && separacaoOk && qualidadeOk && pinturaOk;
      });
    }

    return filtrados;
  }, [pedidos, searchTerm, tipoEntrega, corPintura, mostrarProntos]);

  // Calcular total de portas para a etapa atual
  const totalPortasEtapa = useMemo(() => {
    return pedidosFiltrados.reduce((total, pedido) => {
      const produtos = (pedido.vendas as any)?.produtos_vendas as any[] | undefined;
      if (!produtos) return total;
      
      const portasEnrolar = produtos.filter((p: any) => 
        p.categoria_produto === "porta_enrolar"
      );
      
      return total + portasEnrolar.reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0);
  }, [pedidosFiltrados]);

  // Paginação
  const totalPages = Math.ceil(pedidosFiltrados.length / ITEMS_PER_PAGE);
  const pedidosPaginados = pedidosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset página ao mudar etapa ou filtros
  const handleEtapaChange = (value: string) => {
    setEtapaAtiva(value as EtapaPedido);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pedidos-etapas"] });
    queryClient.invalidateQueries({ queryKey: ["pedidos-contadores"] });
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    });
  };

  const etapas: { value: EtapaPedido; label: string }[] = [
    { value: "aberto", label: "Aberto" },
    { value: "em_producao", label: "Em Produção" },
    { value: "inspecao_qualidade", label: "Qualidade" },
    { value: "aguardando_pintura", label: "Pintura" },
    { value: "aguardando_coleta", label: "Aguardando Coleta" },
    { value: "aguardando_instalacao", label: "Aguardando Instalação" },
    { value: "finalizado", label: "Finalizado" },
  ];

  // Gerar páginas para paginação
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <MinimalistLayout 
      title="Gestão de Pedidos" 
      backPath="/fabrica"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Fábrica", path: "/fabrica" },
        { label: "Pedidos em Produção" }
      ]}
    >
      {/* Dashboard de Portas por Etapa */}
      <div className="mb-6">
        <PortasPorEtapa />
      </div>

      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pedidos por Etapa</h2>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <Tabs value={etapaAtiva} onValueChange={handleEtapaChange}>
        {/* Mobile: Select */}
        <div className="md:hidden mb-4">
          <Select value={etapaAtiva} onValueChange={handleEtapaChange}>
            <SelectTrigger className="w-full bg-primary/5 border-primary/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {etapas.map((etapa) => {
                const Icon = ETAPA_ICONS[etapa.value];
                const count = contadores?.[etapa.value] || 0;
                return (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{etapa.label}</span>
                      <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <div className="hidden md:block">
          <TabsList className="bg-primary/5 border border-primary/10 p-1 h-auto flex-wrap">
            {etapas.map((etapa) => {
              const Icon = ETAPA_ICONS[etapa.value];
              const count = contadores?.[etapa.value] || 0;
              return (
                <TabsTrigger
                  key={etapa.value}
                  value={etapa.value}
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/60 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{etapa.label}</span>
                  <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {etapas.map((etapa) => (
          <TabsContent key={etapa.value} value={etapa.value} className="mt-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ETAPA_ICONS[etapa.value];
                      return <Icon className="w-5 h-5 text-blue-400" />;
                    })()}
                    <span>{etapa.label}</span>
                    <span className="text-sm font-normal text-white/60">
                      ({pedidosFiltrados.length} pedidos • {totalPortasEtapa} portas)
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <PedidosFiltrosMinimalista
                  searchTerm={searchTerm}
                  onSearchChange={(value) => {
                    setSearchTerm(value);
                    setCurrentPage(1);
                  }}
                  tipoEntrega={tipoEntrega}
                  onTipoEntregaChange={(value) => {
                    setTipoEntrega(value);
                    setCurrentPage(1);
                  }}
                  corPintura={corPintura}
                  onCorPinturaChange={(value) => {
                    setCorPintura(value);
                    setCurrentPage(1);
                  }}
                  mostrarProntos={mostrarProntos}
                  onMostrarProntosToggle={() => {
                    setMostrarProntos(!mostrarProntos);
                    setCurrentPage(1);
                  }}
                />

                {/* Lista de pedidos */}
                <PedidosDraggableList
                  pedidos={pedidosPaginados}
                  pedidosParaTotais={pedidosFiltrados}
                  etapa={etapaAtiva}
                  isAberto={etapaAtiva === "aberto"}
                  onMoverEtapa={handleMoverEtapa}
                  onRetrocederEtapa={handleRetrocederEtapa}
                  onReorganizar={handleReorganizar}
                  onMoverPrioridade={handleMoverPrioridade}
                  onArquivar={handleArquivar}
                  onDeletar={handleDeletarPedido}
                  viewMode="list"
                />

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
                            {page === 'ellipsis' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </MinimalistLayout>
  );
}
