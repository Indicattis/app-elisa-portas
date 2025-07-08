
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { OrcamentoFilters } from "@/components/orcamentos/OrcamentoFilters";
import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";
import { OrcamentoTable } from "@/components/orcamentos/OrcamentoTable";
import { OrcamentoApprovalModal } from "@/components/orcamentos/OrcamentoApprovalModal";

export default function Orcamentos() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const {
    leads,
    filteredOrcamentos,
    loading,
    filters,
    setFilters,
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    createOrcamento,
    approveOrcamento,
    rejectOrcamento,
    resetForm
  } = useOrcamentos();

  const handleCreateOrcamento = async (valorTotal: number) => {
    const data = await createOrcamento(valorTotal);
    setShowForm(false);
  };

  const handleApproveOrcamento = async (orcamentoId: string, desconto_adicional: number, observacoes: string) => {
    await approveOrcamento(orcamentoId, desconto_adicional, observacoes);
    setShowApprovalModal(false);
    setSelectedOrcamento(null);
  };

  const handleApprove = (orcamento: any) => {
    setSelectedOrcamento(orcamento);
    setShowApprovalModal(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
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
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/orcamentos/novo")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Orçamento Rápido
          </Button>
        </div>
      </div>

      <OrcamentoFilters 
        filters={filters}
        setFilters={setFilters}
        leads={leads}
      />

      {showForm && (
        <OrcamentoForm
          leads={leads}
          formData={formData}
          setFormData={setFormData}
          camposPersonalizados={camposPersonalizados}
          setCamposPersonalizados={setCamposPersonalizados}
          onSubmit={handleCreateOrcamento}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

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
