
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLeads } from "@/hooks/useLeads";
import { LeadTable } from "@/components/LeadTable";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadIndicators } from "@/components/LeadIndicators";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Lead, FilterValues } from "@/types/lead";
import { LEADS_PER_PAGE } from "@/types/lead";
import { filterLeads } from "@/utils/leadFilters";

export default function Leads() {
  const navigate = useNavigate();
  const { isAdmin, isAtendente, user } = useAuth();
  const { 
    leads, 
    atendentes, 
    leadsWithApprovedBudgets,
    orcamentosInfo,
    loading, 
    handleStartAttendance, 
    handleMarkAsLost,
    handleMarkAsDisqualified,
    handleCancelAttendance,
    handleMarkAsSold,
  } = useLeads();

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

  const filteredLeads = filterLeads(leads, filters);
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);

  const canManageLead = (lead: Lead) => {
    if (isAdmin) return true;
    if (!lead.atendente_id) return true; // Lead sem atendente pode ser capturado
    return lead.atendente_id === user?.id;
  };

  const handleRowDoubleClick = (leadId: string) => {
    navigate(`/dashboard/leads/${leadId}`);
  };

  const handleNavigateToSale = (leadId: string) => {
    navigate(`/dashboard/leads/${leadId}/venda`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Get unique cities from leads for filter
  const cidades = [...new Set(leads.map(lead => lead.cidade).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe seus leads</p>
        </div>
        <Button onClick={() => navigate("/dashboard/leads/novo")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <LeadIndicators />

      <LeadFilters
        filters={filters}
        onFiltersChange={setFilters}
        atendentes={atendentes}
        cidades={cidades}
      />

      <LeadTable
        leads={paginatedLeads}
        atendentes={atendentes}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        canManageLead={canManageLead}
        onRowDoubleClick={handleRowDoubleClick}
        onStartAttendance={handleStartAttendance}
        onNavigateToSale={handleNavigateToSale}
        onMarkAsLost={handleMarkAsLost}
        onMarkAsDisqualified={handleMarkAsDisqualified}
        onCancelAttendance={handleCancelAttendance}
        onMarkAsSold={handleMarkAsSold}
        leadsWithApprovedBudgets={leadsWithApprovedBudgets}
        orcamentosInfo={orcamentosInfo}
      />
    </div>
  );
}
