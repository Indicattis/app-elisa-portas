import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { usePedidosBuscaGeral } from "@/hooks/usePedidosBuscaGeral";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 15;

export default function AcompanharPedido() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { pedidos, isLoading, totalEncontrados } = usePedidosBuscaGeral(debouncedSearch);

  // Paginação
  const totalPages = Math.ceil(pedidos.length / ITEMS_PER_PAGE);
  const pedidosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pedidos.slice(start, start + ITEMS_PER_PAGE);
  }, [pedidos, currentPage]);

  // Gerar números de página para exibição
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <MinimalistLayout
      title="Acompanhar Pedido"
      subtitle="Busque pedidos por número, CPF ou nome do cliente"
      backPath="/vendas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Acompanhar Pedido" }
      ]}
    >
      <div className="max-w-7xl mx-auto">
        {/* Input de busca grande */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
            <Input
              placeholder="Digite o número do pedido, CPF/CNPJ ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-4 text-lg
                         bg-white/5 border-white/10 text-white
                         placeholder:text-white/40
                         focus:border-blue-500/50 focus:ring-blue-500/20
                         rounded-xl"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 animate-spin" />
            )}
          </div>
          <p className="text-center text-white/40 text-sm mt-2">
            Filtre os pedidos usando a busca acima
          </p>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {/* Contador de resultados */}
          <div className="flex items-center justify-between">
            <h3 className="text-white/60 text-sm">
              {isLoading ? (
                'Carregando pedidos...'
              ) : totalEncontrados === 0 ? (
                'Nenhum pedido encontrado'
              ) : (
                `${totalEncontrados} pedido${totalEncontrados > 1 ? 's' : ''} encontrado${totalEncontrados > 1 ? 's' : ''}`
              )}
            </h3>
          </div>

          {/* Lista de pedidos */}
          {!isLoading && pedidosPaginados.length > 0 && (
            <div className="space-y-3">
              {pedidosPaginados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido as any}
                  viewMode="list"
                  isAberto={false}
                  readOnly={true}
                  showEtapaBadge={true}
                />
              ))}
            </div>
          )}

          {/* Mensagem de nenhum resultado */}
          {!isLoading && totalEncontrados === 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/60">
                  {debouncedSearch.length >= 2 
                    ? `Nenhum pedido encontrado para "${debouncedSearch}"`
                    : 'Nenhum pedido encontrado'
                  }
                </p>
                <p className="text-white/40 text-sm mt-2">
                  Tente buscar por número do pedido, CPF/CNPJ ou nome do cliente
                </p>
              </CardContent>
            </Card>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
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
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </MinimalistLayout>
  );
}
