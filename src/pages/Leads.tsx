
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLeads } from "@/hooks/useLeads";
import { LeadTable } from "@/components/LeadTable";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadIndicators } from "@/components/LeadIndicators";
import { LeadStats } from "@/components/LeadStats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Lead, FilterValues } from "@/types/lead";
import { LEADS_PER_PAGE } from "@/types/lead";
import { filterLeads } from "@/utils/leadFilters";

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isAtendente, user } = useAuth();
  const { 
    leads, 
    atendentes, 
    leadsWithApprovedBudgets,
    orcamentosInfo,
    loading, 
    fetchLeads,
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

  const handleTagUpdate = () => {
    fetchLeads();
  };

  // Recarregar dados quando retornar para a página
  useEffect(() => {
    fetchLeads();
  }, [location.pathname]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Efeito para focar no lead específico ao retornar da página de detalhes
  useEffect(() => {
    const focusLeadId = location.state?.focusLeadId;
    if (focusLeadId && leads.length > 0) {
      const leadIndex = filteredLeads.findIndex(lead => lead.id === focusLeadId);
      if (leadIndex !== -1) {
        const targetPage = Math.floor(leadIndex / LEADS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
        
        // Scroll para o lead após um pequeno delay para garantir que a página foi carregada
        setTimeout(() => {
          const leadElement = document.querySelector(`[data-lead-id="${focusLeadId}"]`);
          if (leadElement) {
            leadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Adicionar destaque visual temporário
            leadElement.classList.add('ring-2', 'ring-primary');
            setTimeout(() => {
              leadElement.classList.remove('ring-2', 'ring-primary');
            }, 3000);
          }
        }, 100);
      }
      // Limpar o estado para evitar scroll desnecessário em futuras navegações
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [leads, filteredLeads, location.state, navigate, location.pathname]);

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

      <LeadStats leads={filteredLeads} />

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
        onTagUpdate={handleTagUpdate}
      />
    </div>
  );
}
