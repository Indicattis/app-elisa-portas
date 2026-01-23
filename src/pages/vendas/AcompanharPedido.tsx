import { useState, useMemo } from "react";
import { Search, Loader2, Package, Phone, User, Calendar, MapPin, Truck, Hammer, FileText } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePedidosBuscaGeral, PedidoBuscaGeral } from "@/hooks/usePedidosBuscaGeral";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { EtapaPedido } from "@/types/pedidoEtapa";
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

const ETAPA_BADGES: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  em_producao: { label: "Em Produção", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  inspecao_qualidade: { label: "Qualidade", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  aguardando_pintura: { label: "Pintura", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  aguardando_coleta: { label: "Aguardando Coleta", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  aguardando_instalacao: { label: "Aguardando Instalação", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  instalacoes: { label: "Em Instalação", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  correcoes: { label: "Correções", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  finalizado: { label: "Finalizado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

function PedidoCardSimples({ pedido }: { pedido: PedidoBuscaGeral }) {
  // Usar created_at como data de referência
  const etapaBadge = ETAPA_BADGES[pedido.etapa_atual] || ETAPA_BADGES.aberto;
  const venda = pedido.vendas;
  
  // Contar portas
  const totalPortas = venda?.produtos_vendas?.reduce((acc, prod) => {
    if (prod.tipo_produto?.includes('porta_enrolar')) {
      return acc + (prod.quantidade || 1);
    }
    return acc;
  }, 0) || 0;

  // Cores únicas
  const cores = [...new Set(
    venda?.produtos_vendas
      ?.map(p => p.cor)
      .filter(Boolean) || []
  )];

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-white">
                #{pedido.numero_pedido}
              </span>
              <Badge 
                variant="outline" 
                className={`${etapaBadge.color} border`}
              >
                {etapaBadge.label}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="truncate">{venda?.cliente_nome || 'Cliente não informado'}</span>
              </div>
              
              {venda?.cliente_telefone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>{venda.cliente_telefone}</span>
                </div>
              )}
              
              {venda?.cpf_cnpj && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{venda.cpf_cnpj}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info secundária */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {totalPortas > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400">
                <Package className="w-4 h-4" />
                <span>{totalPortas} porta{totalPortas > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {cores.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400">
                <span className="text-xs">Cor: {cores.join(', ')}</span>
              </div>
            )}
            
            {venda?.tipo_entrega && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                venda.tipo_entrega === 'instalacao' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-orange-500/10 text-orange-400'
              }`}>
                {venda.tipo_entrega === 'instalacao' ? (
                  <Hammer className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                <span className="text-xs capitalize">{venda.tipo_entrega}</span>
              </div>
            )}

            {venda?.valor_venda && (
              <div className="text-white font-medium">
                {formatCurrency(venda.valor_venda)}
              </div>
            )}
          </div>

          {/* Data */}
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {pedido.created_at 
                ? format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })
                : 'Sem data'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AcompanharPedido() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce da busca
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  });

  // Atualizar debounced search quando searchTerm mudar
  useMemo(() => {
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
      <div className="max-w-4xl mx-auto">
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
            Digite pelo menos 2 caracteres para buscar
          </p>
        </div>

        {/* Resultados */}
        {debouncedSearch.length >= 2 && (
          <div className="space-y-4">
            {/* Contador de resultados */}
            <div className="flex items-center justify-between">
              <h3 className="text-white/60 text-sm">
                {isLoading ? (
                  'Buscando...'
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
                  <PedidoCardSimples key={pedido.id} pedido={pedido} />
                ))}
              </div>
            )}

            {/* Mensagem de nenhum resultado */}
            {!isLoading && totalEncontrados === 0 && debouncedSearch.length >= 2 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  <p className="text-white/60">
                    Nenhum pedido encontrado para "{debouncedSearch}"
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
        )}

        {/* Estado inicial */}
        {debouncedSearch.length < 2 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-medium text-white mb-2">
                Busque um pedido
              </h3>
              <p className="text-white/60 max-w-md mx-auto">
                Use a barra de busca acima para localizar pedidos em qualquer etapa do processo.
                Você pode buscar pelo número do pedido, CPF/CNPJ ou nome do cliente.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MinimalistLayout>
  );
}
