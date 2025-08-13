
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { OrcamentoFilters } from "@/components/orcamentos/OrcamentoFilters";
import { OrcamentoTable } from "@/components/orcamentos/OrcamentoTable";

export default function Orcamentos() {
  const navigate = useNavigate();

  const {
    leads,
    filteredOrcamentos,
    filters,
    setFilters,
    fetchOrcamentos
  } = useOrcamentos();

  const handleEdit = (orcamento: any) => {
    navigate(`/dashboard/orcamentos/editar/${orcamento.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos dos leads</p>
        </div>
        <Button 
          onClick={() => navigate("/dashboard/orcamentos/novo")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <OrcamentoFilters 
        filters={filters}
        setFilters={setFilters}
        leads={leads}
      />

      <OrcamentoTable
        orcamentos={filteredOrcamentos}
        onEdit={handleEdit}
        onRefresh={fetchOrcamentos}
      />
    </div>
  );
}
