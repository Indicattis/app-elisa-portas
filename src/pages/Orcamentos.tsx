
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { OrcamentoFilters } from "@/components/orcamentos/OrcamentoFilters";
import { OrcamentoTable } from "@/components/orcamentos/OrcamentoTable";
import { OrcamentoApprovalModal } from "@/components/orcamentos/OrcamentoApprovalModal";

export default function Orcamentos() {
  const navigate = useNavigate();
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const {
    leads,
    filteredOrcamentos,
    filters,
    setFilters,
    approveOrcamento,
    rejectOrcamento,
  } = useOrcamentos();

  const handleApproveOrcamento = async (orcamentoId: string, desconto_adicional: number, tipo_desconto: string, observacoes: string) => {
    await approveOrcamento(orcamentoId, desconto_adicional, tipo_desconto, observacoes);
    setShowApprovalModal(false);
    setSelectedOrcamento(null);
  };

  const handleApprove = (orcamento: any) => {
    setSelectedOrcamento(orcamento);
    setShowApprovalModal(true);
  };

  const handleCancelApproval = () => {
    setShowApprovalModal(false);
    setSelectedOrcamento(null);
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
        onApprove={handleApprove}
        onReject={rejectOrcamento}
      />

      {showApprovalModal && selectedOrcamento && (
        <OrcamentoApprovalModal
          orcamento={selectedOrcamento}
          onApprove={handleApproveOrcamento}
          onCancel={handleCancelApproval}
        />
      )}
    </div>
  );
}
