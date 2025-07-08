
import { useState, useMemo } from "react";
import type { OrcamentoFilters } from "@/types/orcamento";

export function useOrcamentoFilters(orcamentos: any[] = []) {
  const [filters, setFilters] = useState<OrcamentoFilters>({
    search: "",
    status: "",
    lead: ""
  });

  const filteredOrcamentos = useMemo(() => {
    // Sempre retorne um array, mesmo se orcamentos não estiver pronto
    if (!orcamentos || !Array.isArray(orcamentos)) {
      return [];
    }

    let filtered = [...orcamentos]; // Crie uma cópia para evitar mutações

    if (filters.search) {
      filtered = filtered.filter(orc => {
        const lead = orc.elisaportas_leads;
        if (!lead) return false;
        
        return lead.nome?.toLowerCase().includes(filters.search.toLowerCase()) ||
               lead.telefone?.includes(filters.search);
      });
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
