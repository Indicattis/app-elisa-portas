import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, User, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { usePedidosEtapas } from "@/hooks/usePedidosEtapas";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ITEMS_PER_PAGE = 10;

export default function PedidosProducaoMinimalista() {
  const navigate = useNavigate();
  const { pedidos, isLoading } = usePedidosEtapas("em_producao");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar pedidos por busca
  const filteredPedidos = useMemo(() => {
    if (!searchTerm.trim()) return pedidos;
    const term = searchTerm.toLowerCase();
    return pedidos.filter((p) => 
      p.numero_pedido?.toLowerCase().includes(term) ||
      p.vendas?.cliente_nome?.toLowerCase().includes(term)
    );
  }, [pedidos, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);
  const paginatedPedidos = filteredPedidos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Função para formatar tempo na etapa
  const getTempoNaEtapa = (pedido: any) => {
    const etapaAtual = pedido.pedidos_etapas?.find(
      (e: any) => e.etapa === "em_producao" && !e.data_saida
    );
    if (etapaAtual?.data_entrada) {
      return formatDistanceToNow(new Date(etapaAtual.data_entrada), {
        locale: ptBR,
        addSuffix: false,
      });
    }
    return "-";
  };

  // Status das ordens
  const getOrdemStatus = (ordem: any) => {
    if (!ordem) return { color: "bg-white/20", label: "Pendente" };
    if (ordem.status === "finalizada") return { color: "bg-green-500", label: "Concluída" };
    if (ordem.status === "em_andamento") return { color: "bg-yellow-500", label: "Em andamento" };
    return { color: "bg-white/30", label: "Aguardando" };
  };

  return (
    <MinimalistLayout title="Pedidos em Produção" backPath="/fabrica">
      {/* Header com busca e contador */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-white/60 text-sm">
            {filteredPedidos.length} pedido{filteredPedidos.length !== 1 ? "s" : ""} em produção
          </span>
        </div>

        {/* Busca */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                       text-white placeholder:text-white/40 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                       transition-all"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredPedidos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/60">
            {searchTerm ? "Nenhum pedido encontrado" : "Nenhum pedido em produção"}
          </p>
        </div>
      )}

      {/* Lista de pedidos */}
      {!isLoading && filteredPedidos.length > 0 && (
        <div className="space-y-3">
          {paginatedPedidos.map((pedido) => (
            <div
              key={pedido.id}
              onClick={() => navigate(`/hub-fabrica/producao/pedido/${pedido.id}`)}
              className="p-4 rounded-xl bg-white/5 border border-white/10 
                         hover:bg-white/10 hover:border-white/20
                         cursor-pointer transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Info principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-white">
                      #{pedido.numero_pedido}
                    </span>
                    {pedido.vendas?.atendente?.foto_perfil_url ? (
                      <img
                        src={pedido.vendas.atendente.foto_perfil_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-white/60" />
                      </div>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mb-2">
                    {pedido.vendas?.cliente_nome || "Cliente não informado"}
                  </p>
                  
                  {/* Cores dos produtos */}
                  {(() => {
                    const produtos = (pedido.vendas as any)?.produtos_vendas as any[] | undefined;
                    const cores = produtos?.filter((p: any) => p.cor) || [];
                    if (cores.length === 0) return null;
                    
                    const uniqueCores = Array.from(
                      new Set(cores.map((p: any) => JSON.stringify(p.cor)))
                    );
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        {uniqueCores.map((corStr: any, idx: number) => {
                          const cor = JSON.parse(corStr);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10"
                            >
                              <div
                                className="w-3 h-3 rounded-full border border-white/30"
                                style={{ backgroundColor: cor.codigo_hex }}
                              />
                              <span className="text-xs text-white/60">{cor.nome}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Tempo e status das ordens */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getTempoNaEtapa(pedido)}</span>
                  </div>
                  
                  {/* Status das ordens */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: "soldagem", label: "S" },
                      { key: "perfiladeira", label: "P" },
                      { key: "separacao", label: "Se" },
                    ].map((ordem) => {
                      const ordemData = pedido[`ordens_${ordem.key}`];
                      const status = getOrdemStatus(ordemData);
                      return (
                        <div
                          key={ordem.key}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white/80 ${status.color}`}
                          title={`${ordem.key}: ${status.label}`}
                        >
                          {ordem.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 
                       hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <span className="px-4 py-2 text-white/60 text-sm">
            {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/10 
                       hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </div>
      )}
    </MinimalistLayout>
  );
}
