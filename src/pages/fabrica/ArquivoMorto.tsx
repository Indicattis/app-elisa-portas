import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, Search, Calendar, User, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { DelayedParticles } from "@/components/DelayedParticles";
import { usePedidosArquivados } from "@/hooks/usePedidosArquivados";

export default function ArquivoMorto() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: pedidos = [], isLoading } = usePedidosArquivados(debouncedSearch);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      <DelayedParticles />

      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Fábrica", path: "/fabrica" },
          { label: "Arquivo Morto" },
        ]}
        mounted={mounted}
      />

      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate("/fabrica")}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateX(0)" : "translateX(-20px)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col items-center px-4 pt-20 pb-8">
        <div
          className="w-full max-w-4xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Arquivo Morto</h1>
              <p className="text-sm text-zinc-400">
                {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} arquivado{pedidos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Busca */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar por número do pedido ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Archive className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {search ? "Nenhum pedido encontrado" : "Nenhum pedido arquivado"}
                </p>
              </div>
            ) : (
              pedidos.map((pedido, index) => (
                <Card
                  key={pedido.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/administrativo/pedidos/${pedido.id}`)}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${300 + index * 50}ms`,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Info Principal */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <Package className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">
                              {pedido.numero_pedido}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                            >
                              Arquivado
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-300">{pedido.cliente_nome}</p>
                        </div>
                      </div>

                      {/* Info Secundária */}
                      <div className="flex flex-col sm:items-end gap-1 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(pedido.data_arquivamento)}</span>
                        </div>
                        {pedido.arquivado_por_nome && (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs">por {pedido.arquivado_por_nome}</span>
                          </div>
                        )}
                        {pedido.valor_venda && (
                          <span className="text-emerald-400 font-medium">
                            {formatCurrency(pedido.valor_venda)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
