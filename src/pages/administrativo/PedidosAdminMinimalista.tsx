import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 25;

export default function PedidosAdminMinimalista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { pedidos, isLoading } = usePedidosEtapas("aberto");

  // Filtrar pedidos
  const pedidosFiltrados = useMemo(() => {
    let filtrados = pedidos;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.numero_pedido?.toLowerCase().includes(termo) ||
          p.vendas?.cliente_nome?.toLowerCase().includes(termo)
      );
    }

    // Filtro por tipo de entrega
    if (tipoEntrega !== "todos") {
      filtrados = filtrados.filter((p) => p.vendas?.tipo_entrega === tipoEntrega);
    }

    return filtrados;
  }, [pedidos, searchTerm, tipoEntrega]);

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
      title="Pedidos" 
      subtitle={`${pedidosFiltrados.length} pedidos em aberto`}
      backPath="/administrativo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Pedidos" }
      ]}
    >
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pedidos em Aberto</h2>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <span>Aberto</span>
              <span className="text-sm font-normal text-white/60">
                ({pedidosFiltrados.length} pedidos • {totalPortasEtapa} portas)
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar por cliente ou número..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
              />
            </div>
            <Select 
              value={tipoEntrega} 
              onValueChange={(value) => {
                setTipoEntrega(value);
                setCurrentPage(1);
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

          {/* Lista de pedidos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
          ) : pedidosPaginados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/60">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosPaginados.map((pedido) => (
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
    </MinimalistLayout>
  );
}
