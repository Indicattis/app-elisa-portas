
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadIndicators } from "@/components/LeadIndicators";
import { LeadTable } from "@/components/LeadTable";
import { useAuth } from "@/hooks/useAuth";
import { useLeads } from "@/hooks/useLeads";
import { Plus } from "lucide-react";
import type { FilterValues } from "@/types/lead";
import { LEADS_PER_PAGE } from "@/types/lead";
import { filterLeads } from "@/utils/leadFilters";

export default function Leads() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    status: "",
    atendente: "",
    cidade: "",
    dataInicio: "",
    dataFim: "",
    etiqueta: "",
  });
  const { isAdmin, user } = useAuth();
  const { leads, atendentes, loading, handleStartAttendance, handleMarkAsLost } = useLeads();
  const navigate = useNavigate();

  // Aplicar filtros
  const filteredLeads = filterLeads(leads, filters);

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Obter cidades únicas para o filtro
  const uniqueCidades = [...new Set(leads.map(lead => lead.cidade).filter(Boolean))].sort();

  const canManageLead = (lead: any) => {
    return isAdmin || lead.atendente_id === user?.id || lead.atendente_id === null;
  };

  const handleRowDoubleClick = (leadId: string) => {
    navigate(`/dashboard/leads/${leadId}`);
  };

  const handleNavigateToSale = (leadId: string) => {
    navigate(`/dashboard/vendas/nova?lead=${leadId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Gerencie todos os leads do sistema</p>
        </div>
        <Button onClick={() => navigate("/dashboard/leads/novo")}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Lead
        </Button>
      </div>

      <LeadIndicators />

      <LeadFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        atendentes={atendentes}
        cidades={uniqueCidades}
      />

      <LeadTable
        leads={paginatedLeads}
        atendentes={atendentes}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        canManageLead={canManageLead}
        onRowDoubleClick={handleRowDoubleClick}
        onStartAttendance={handleStartAttendance}
        onNavigateToSale={handleNavigateToSale}
        onMarkAsLost={handleMarkAsLost}
      />
    </div>
  );
}
