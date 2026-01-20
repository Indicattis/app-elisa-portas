import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Search, Loader2, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { supabase } from "@/integrations/supabase/client";
import { useMateriaisNecessariosProducao } from "@/hooks/useMateriaisNecessariosProducao";

interface EstoqueItem {
  id: string;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  quantidade_ideal: number | null;
  unidade: string | null;
  categoria: string | null;
}

export default function ControleEstoqueMinimalista() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "critico" | "atencao" | "ok">("todos");

  // Buscar itens do estoque
  const { data: estoqueItems = [], isLoading: loadingEstoque } = useQuery({
    queryKey: ["estoque-minimalista"],
    queryFn: async (): Promise<EstoqueItem[]> => {
      const { data, error } = await supabase
        .from("estoque")
        .select("id, nome_produto, descricao_produto, quantidade, quantidade_ideal, unidade, categoria")
        .eq("ativo", true)
        .order("nome_produto");

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar materiais necessários para produção
  const { data: materiaisNecessarios = [], isLoading: loadingMateriais } = useMateriaisNecessariosProducao();

  // Mapear materiais necessários por estoque_id
  const materiaisMap = useMemo(() => {
    const map = new Map<string, number>();
    materiaisNecessarios.forEach((m) => {
      map.set(m.estoque_id, m.quantidade_necessaria);
    });
    return map;
  }, [materiaisNecessarios]);

  // Combinar dados e calcular status
  const itemsComStatus = useMemo(() => {
    return estoqueItems.map((item) => {
      const qtdNecessaria = materiaisMap.get(item.id) || 0;
      const qtdAtual = item.quantidade || 0;
      const qtdIdeal = item.quantidade_ideal || 0;

      let status: "critico" | "atencao" | "ok" = "ok";
      if (qtdNecessaria > 0 && qtdAtual < qtdNecessaria) {
        status = "critico";
      } else if (qtdIdeal > 0 && qtdAtual < qtdIdeal) {
        status = "atencao";
      }

      return {
        ...item,
        quantidade_necessaria: qtdNecessaria,
        status,
      };
    });
  }, [estoqueItems, materiaisMap]);

  // Filtrar por busca e status
  const filteredItems = useMemo(() => {
    let items = itemsComStatus;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.nome_produto.toLowerCase().includes(term) ||
          item.descricao_produto?.toLowerCase().includes(term) ||
          item.categoria?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "todos") {
      items = items.filter((item) => item.status === filterStatus);
    }

    // Ordenar: críticos primeiro, depois atenção, depois ok
    return items.sort((a, b) => {
      const order = { critico: 0, atencao: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });
  }, [itemsComStatus, searchTerm, filterStatus]);

  // Contadores
  const counts = useMemo(() => {
    return {
      critico: itemsComStatus.filter((i) => i.status === "critico").length,
      atencao: itemsComStatus.filter((i) => i.status === "atencao").length,
      ok: itemsComStatus.filter((i) => i.status === "ok").length,
    };
  }, [itemsComStatus]);

  const isLoading = loadingEstoque || loadingMateriais;

  const getStatusConfig = (status: "critico" | "atencao" | "ok") => {
    switch (status) {
      case "critico":
        return {
          icon: AlertTriangle,
          color: "text-red-400",
          bg: "bg-red-500/20",
          border: "border-red-500/30",
          label: "Crítico",
        };
      case "atencao":
        return {
          icon: AlertCircle,
          color: "text-yellow-400",
          bg: "bg-yellow-500/20",
          border: "border-yellow-500/30",
          label: "Atenção",
        };
      case "ok":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bg: "bg-green-500/20",
          border: "border-green-500/30",
          label: "OK",
        };
    }
  };

  return (
    <MinimalistLayout title="Controle de Estoque" backPath="/fabrica">
      {/* Header com filtros */}
      <div className="mb-6 space-y-4">
        {/* Contadores de status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("todos")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                       ${filterStatus === "todos" 
                         ? "bg-blue-500 text-white" 
                         : "bg-white/5 text-white/60 hover:bg-white/10"}`}
          >
            Todos ({itemsComStatus.length})
          </button>
          <button
            onClick={() => setFilterStatus("critico")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
                       ${filterStatus === "critico" 
                         ? "bg-red-500 text-white" 
                         : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
          >
            <AlertTriangle className="w-3 h-3" />
            Crítico ({counts.critico})
          </button>
          <button
            onClick={() => setFilterStatus("atencao")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
                       ${filterStatus === "atencao" 
                         ? "bg-yellow-500 text-white" 
                         : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"}`}
          >
            <AlertCircle className="w-3 h-3" />
            Atenção ({counts.atencao})
          </button>
          <button
            onClick={() => setFilterStatus("ok")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
                       ${filterStatus === "ok" 
                         ? "bg-green-500 text-white" 
                         : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}
          >
            <CheckCircle className="w-3 h-3" />
            OK ({counts.ok})
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nome, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
      {!isLoading && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/60">
            {searchTerm || filterStatus !== "todos"
              ? "Nenhum item encontrado com os filtros aplicados"
              : "Nenhum item no estoque"}
          </p>
        </div>
      )}

      {/* Grid de itens */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-white/5 border transition-all duration-200
                           hover:bg-white/10 ${statusConfig.border}`}
              >
                {/* Header do card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                    {item.nome_produto}
                  </h3>
                  <div className={`p-1.5 rounded-lg ${statusConfig.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>
                </div>

                {/* Descrição */}
                {item.descricao_produto && (
                  <p className="text-white/50 text-xs mb-3 line-clamp-1">
                    {item.descricao_produto}
                  </p>
                )}

                {/* Quantidades */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Estoque atual:</span>
                    <span className="text-white font-semibold text-sm">
                      {item.quantidade} {item.unidade || "un"}
                    </span>
                  </div>

                  {item.quantidade_necessaria > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-xs">Necessário produção:</span>
                      <span className={`font-semibold text-sm ${
                        item.quantidade < item.quantidade_necessaria 
                          ? "text-red-400" 
                          : "text-white"
                      }`}>
                        {item.quantidade_necessaria} {item.unidade || "un"}
                      </span>
                    </div>
                  )}

                  {item.quantidade_ideal && item.quantidade_ideal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-xs">Quantidade ideal:</span>
                      <span className="text-white/70 text-sm">
                        {item.quantidade_ideal} {item.unidade || "un"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Categoria */}
                {item.categoria && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                      {item.categoria}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MinimalistLayout>
  );
}
