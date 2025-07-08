
import { useState, useMemo } from "react";
import type { OrcamentoFilters } from "@/types/orcamento";

export function useOrcamentoFilters(orcamentos: any[]) {
  const [filters, setFilters] = useState<OrcamentoFilters>({
    search: "",
    status: "",
    lead: ""
  });

  const filteredOrcamentos = useMemo(() => {
    let filtered = orcamentos;

    if (filters.search) {
      filtered = filtered.filter(orc => 
        orc.elisaportas_leads?.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        orc.elisaportas_leads?.telefone.includes(filters.search)
      );
    }

    if (filters.status && filters.status !== "todos") {
      filtered = filtered.filter(orc => orc.status === filters.status);
    }

    if (filters.lead && filters.lead !== "todos") {
      filtered = filtered.filter(orc => orc.lead_id === filters.lead);
    }

    return filtered;
  }, [orcamentos, filters]);

  return {
    filters,
    setFilters,
    filteredOrcamentos
  };
}
