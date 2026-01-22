import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw, Search, Factory } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 25;

export default function PedidosAdminMinimalista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<string>("todos");
  const [currentPageAberto, setCurrentPageAberto] = useState(1);
  const [currentPageProducao, setCurrentPageProducao] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("aberto");
  
  const { pedidos: pedidosAberto, isLoading: isLoadingAberto } = usePedidosEtapas("aberto");
  const { pedidos: pedidosProducao, isLoading: isLoadingProducao } = usePedidosEtapas("em_producao");

  // Filtrar pedidos em aberto
  const pedidosAbertoFiltrados = useMemo(() => {
    let filtrados = pedidosAberto;

    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.numero_pedido?.toLowerCase().includes(termo) ||
          p.vendas?.cliente_nome?.toLowerCase().includes(termo)
      );
    }

    if (tipoEntrega !== "todos") {
      filtrados = filtrados.filter((p) => p.vendas?.tipo_entrega === tipoEntrega);
    }

    return filtrados;
  }, [pedidosAberto, searchTerm, tipoEntrega]);

  // Filtrar pedidos em produção
  const pedidosProducaoFiltrados = useMemo(() => {
    let filtrados = pedidosProducao;

    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.numero_pedido?.toLowerCase().includes(termo) ||
          p.vendas?.cliente_nome?.toLowerCase().includes(termo)
      );
    }

    if (tipoEntrega !== "todos") {
      filtrados = filtrados.filter((p) => p.vendas?.tipo_entrega === tipoEntrega);
    }

    return filtrados;
  }, [pedidosProducao, searchTerm, tipoEntrega]);

  // Calcular total de portas para cada etapa
  const calcularTotalPortas = (pedidos: typeof pedidosAberto) => {
    return pedidos.reduce((total, pedido) => {
      const produtos = (pedido.vendas as any)?.produtos_vendas as any[] | undefined;
      if (!produtos) return total;
      
      const portasEnrolar = produtos.filter((p: any) => 
        p.categoria_produto === "porta_enrolar" || p.tipo_produto === "porta_enrolar"
      );
      
      return total + portasEnrolar.reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0);
  };

  const totalPortasAberto = useMemo(() => calcularTotalPortas(pedidosAbertoFiltrados), [pedidosAbertoFiltrados]);
  const totalPortasProducao = useMemo(() => calcularTotalPortas(pedidosProducaoFiltrados), [pedidosProducaoFiltrados]);

  // Paginação para aberto
  const totalPagesAberto = Math.ceil(pedidosAbertoFiltrados.length / ITEMS_PER_PAGE);
  const pedidosAbertoPaginados = pedidosAbertoFiltrados.slice(
    (currentPageAberto - 1) * ITEMS_PER_PAGE,
    currentPageAberto * ITEMS_PER_PAGE
  );

  // Paginação para produção
  const totalPagesProducao = Math.ceil(pedidosProducaoFiltrados.length / ITEMS_PER_PAGE);
  const pedidosProducaoPaginados = pedidosProducaoFiltrados.slice(
    (currentPageProducao - 1) * ITEMS_PER_PAGE,
    currentPageProducao * ITEMS_PER_PAGE
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pedidos-etapas"] });
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    });
  };

  const handlePedidoClick = (pedidoId: string) => {
    navigate(`/administrativo/pedidos/${pedidoId}`);
  };

  // Gerar páginas para paginação
  const getPageNumbers = (currentPage: number, totalPages: number) => {
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

  const totalPedidos = pedidosAbertoFiltrados.length + pedidosProducaoFiltrados.length;

  return (
    <MinimalistLayout 
      title="Pedidos" 
      subtitle={`${totalPedidos} pedidos ativos`}
      backPath="/administrativo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Pedidos" }
      ]}
    >
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pedidos</h2>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Filtros globais */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar por cliente ou número..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPageAberto(1);
              setCurrentPageProducao(1);
            }}
            className="pl-10 bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
          />
        </div>
        <Select 
          value={tipoEntrega} 
          onValueChange={(value) => {
            setTipoEntrega(value);
            setCurrentPageAberto(1);
            setCurrentPageProducao(1);
          }}
        >
          <SelectTrigger className="w-[160px] bg-primary/5 border-primary/10 text-white">
            <SelectValue placeholder="Tipo de entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="instalacao">Instalação</SelectItem>
            <SelectItem value="entrega">Entrega</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs para alternar entre Aberto e Em Produção */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-primary/5 border border-primary/10">
          <TabsTrigger 
            value="aberto" 
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            <Package className="w-4 h-4 mr-2" />
            Aberto ({pedidosAbertoFiltrados.length})
          </TabsTrigger>
          <TabsTrigger 
            value="producao"
            className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
          >
            <Factory className="w-4 h-4 mr-2" />
            Em Produção ({pedidosProducaoFiltrados.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pedidos em Aberto */}
        <TabsContent value="aberto">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span>Pedidos em Aberto</span>
                  <span className="text-sm font-normal text-white/60">
                    ({pedidosAbertoFiltrados.length} pedidos • {totalPortasAberto} portas)
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAberto ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                </div>
              ) : pedidosAbertoPaginados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <Package className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhum pedido em aberto encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pedidosAbertoPaginados.map((pedido) => (
                    <div
                      key={pedido.id}
                      onClick={() => handlePedidoClick(pedido.id)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <PedidoCard
                        pedido={pedido}
                        isAberto={true}
                        viewMode="list"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Paginação */}
              {totalPagesAberto > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPageAberto((p) => Math.max(1, p - 1))}
                          className={currentPageAberto === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers(currentPageAberto, totalPagesAberto).map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPageAberto(page)}
                              isActive={currentPageAberto === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPageAberto((p) => Math.min(totalPagesAberto, p + 1))}
                          className={currentPageAberto === totalPagesAberto ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pedidos em Produção */}
        <TabsContent value="producao">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-orange-400" />
                  <span>Pedidos em Produção</span>
                  <span className="text-sm font-normal text-white/60">
                    ({pedidosProducaoFiltrados.length} pedidos • {totalPortasProducao} portas)
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducao ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
                </div>
              ) : pedidosProducaoPaginados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <Factory className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhum pedido em produção encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pedidosProducaoPaginados.map((pedido) => (
                    <div
                      key={pedido.id}
                      onClick={() => handlePedidoClick(pedido.id)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <PedidoCard
                        pedido={pedido}
                        isAberto={false}
                        viewMode="list"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Paginação */}
              {totalPagesProducao > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPageProducao((p) => Math.max(1, p - 1))}
                          className={currentPageProducao === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers(currentPageProducao, totalPagesProducao).map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPageProducao(page)}
                              isActive={currentPageProducao === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPageProducao((p) => Math.min(totalPagesProducao, p + 1))}
                          className={currentPageProducao === totalPagesProducao ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MinimalistLayout>
  );
}
