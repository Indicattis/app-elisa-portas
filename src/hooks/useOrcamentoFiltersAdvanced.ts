import { useState, useMemo } from "react";

interface OrcamentoFiltersAdvanced {
  search: string;
  status: string;
  classe: string;
  atendente: string;
  dataInicio: string;
  dataFim: string;
}

export function useOrcamentoFiltersAdvanced(orcamentos: any[] = []) {
  const [filters, setFilters] = useState<OrcamentoFiltersAdvanced>({
    search: "",
    status: "todos",
    classe: "todas",
    atendente: "todos",
    dataInicio: "",
    dataFim: ""
  });

  const filteredOrcamentos = useMemo(() => {
    if (!orcamentos || !Array.isArray(orcamentos)) {
      return [];
    }

    let filtered = [...orcamentos];

    // Filtro de busca por nome do cliente
    if (filters.search) {
      filtered = filtered.filter(orc => 
        orc.cliente_nome?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtro por status
    if (filters.status && filters.status !== "todos") {
      filtered = filtered.filter(orc => orc.status === filters.status);
    }

    // Filtro por classe
    if (filters.classe && filters.classe !== "todas") {
      filtered = filtered.filter(orc => orc.classe === parseInt(filters.classe));
    }

    // Filtro por atendente
    if (filters.atendente && filters.atendente !== "todos") {
      filtered = filtered.filter(orc => orc.atendente_id === filters.atendente);
    }

    // Filtro por data de início
    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      filtered = filtered.filter(orc => {
        const dataOrcamento = new Date(orc.created_at);
        return dataOrcamento >= dataInicio;
      });
    }

    // Filtro por data de fim
    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Final do dia
      filtered = filtered.filter(orc => {
        const dataOrcamento = new Date(orc.created_at);
        return dataOrcamento <= dataFim;
      });
    }

    return filtered;
  }, [orcamentos, filters]);

  return {
    filters,
    setFilters,
    filteredOrcamentos
  };
}