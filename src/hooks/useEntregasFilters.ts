import { useMemo, useState } from "react";
import { Entrega } from "./useEntregas";

export const useEntregasFilters = (entregas: Entrega[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pronta_fabrica");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all");

  const filteredEntregas = useMemo(() => {
    return entregas.filter((entrega) => {
      // Busca por nome do cliente
      const matchesSearch = entrega.nome_cliente
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro por quick filter (prioritário sobre status select)
      if (quickFilter !== "all") {
        if (quickFilter === "pendentes" && entrega.status !== "pendente_producao") return false;
        if (quickFilter === "em_producao" && entrega.status !== "em_producao") return false;
        if (quickFilter === "prontas" && entrega.status !== "pronta_fabrica") return false;
        if (quickFilter === "concluidas" && !entrega.entrega_concluida) return false;
        if (quickFilter === "atrasadas") {
          const isAtrasada = entrega.data_entrega && 
            new Date(entrega.data_entrega) < new Date() && 
            !entrega.entrega_concluida;
          if (!isAtrasada) return false;
        }
      } else if (filterStatus !== "all" && entrega.status !== filterStatus) {
        return false;
      }

      // Filtro por estado
      if (filterEstado !== "all" && entrega.estado !== filterEstado) {
        return false;
      }

      return true;
    });
  }, [entregas, searchTerm, filterStatus, filterEstado, quickFilter]);

  const sortedEntregas = useMemo(() => {
    return [...filteredEntregas].sort((a, b) => {
      // Priorizar atrasadas
      const aAtrasada = a.data_entrega && new Date(a.data_entrega) < new Date() && !a.entrega_concluida;
      const bAtrasada = b.data_entrega && new Date(b.data_entrega) < new Date() && !b.entrega_concluida;
      
      if (aAtrasada && !bAtrasada) return -1;
      if (!aAtrasada && bAtrasada) return 1;

      // Depois por data de entrega
      if (a.data_entrega && b.data_entrega) {
        return new Date(a.data_entrega).getTime() - new Date(b.data_entrega).getTime();
      }
      
      return 0;
    });
  }, [filteredEntregas]);

  const estados = useMemo(() => {
    const uniqueEstados = new Set(entregas.map((e) => e.estado));
    return Array.from(uniqueEstados).sort();
  }, [entregas]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterEstado,
    setFilterEstado,
    quickFilter,
    setQuickFilter,
    filteredEntregas: sortedEntregas,
    estados,
  };
};
