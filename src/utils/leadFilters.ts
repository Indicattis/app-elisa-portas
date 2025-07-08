import type { Lead, FilterValues } from "@/types/lead";
import { getLeadStatus } from "./leadStatus";

export function filterLeads(leads: Lead[], filters: FilterValues): Lead[] {
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
        : lead.atendente_id === filters.atendente
    );

    const matchesCidade = !filters.cidade || lead.cidade === filters.cidade;

    const leadDate = new Date(lead.data_envio);
    const matchesDataInicio = !filters.dataInicio || leadDate >= new Date(filters.dataInicio);
    const matchesDataFim = !filters.dataFim || leadDate <= new Date(filters.dataFim + "T23:59:59");

    // Por padrão, não exibir leads vendidos (status 5) e cancelados (status 6) a menos que seja filtrado especificamente
    const shouldHideVendidos = !filters.status && lead.status_atendimento === 5;
    const shouldHideCancelados = !filters.status && lead.status_atendimento === 6;

    return matchesSearch && matchesStatus && matchesAtendente && matchesCidade && matchesDataInicio && matchesDataFim && !shouldHideVendidos && !shouldHideCancelados;
  });
}