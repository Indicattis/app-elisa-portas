
import type { Lead, FilterValues } from "@/types/lead";
import { getLeadStatus } from "./leadStatus";

// Atualizar interface para incluir etiqueta
interface ExtendedFilterValues extends FilterValues {
  etiqueta: string;
}

export function filterLeads(leads: Lead[], filters: ExtendedFilterValues): Lead[] {
  return leads.filter((lead) => {
    const matchesSearch = !filters.search || (
      lead.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.telefone.includes(filters.search) ||
      lead.cidade?.toLowerCase().includes(filters.search.toLowerCase())
    );

    const leadStatus = getLeadStatus(lead);
    const matchesStatus = !filters.status || leadStatus === filters.status;

    const matchesAtendente = !filters.atendente || (
      filters.atendente === "sem_atendente" 
        ? !lead.atendente_id 
        : filters.atendente === "all_attendants"
        ? true
        : lead.atendente_id === filters.atendente
    );

    const matchesCidade = !filters.cidade || filters.cidade === "all_cities" || lead.cidade === filters.cidade;

    const leadDate = new Date(lead.data_envio);
    const matchesDataInicio = !filters.dataInicio || leadDate >= new Date(filters.dataInicio);
    const matchesDataFim = !filters.dataFim || leadDate <= new Date(filters.dataFim + "T23:59:59");

    // Filtro por etiqueta
    let matchesEtiqueta = true;
    if (filters.etiqueta) {
      try {
        if (lead.observacoes) {
          const parsed = JSON.parse(lead.observacoes);
          const leadTags = parsed.tags || [];
          matchesEtiqueta = leadTags.includes(filters.etiqueta);
        } else {
          matchesEtiqueta = false;
        }
      } catch {
        matchesEtiqueta = false;
      }
    }

    return matchesSearch && matchesStatus && matchesAtendente && matchesCidade && 
           matchesDataInicio && matchesDataFim && matchesEtiqueta;
  });
}
