
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");

  const {
    leads,
    loading,
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    createOrcamento,
    resetForm
  } = useOrcamentos();

  // Se um lead foi especificado, pre-selecionar
  useEffect(() => {
    if (leadId && formData.lead_id !== leadId) {
      setFormData({ ...formData, lead_id: leadId });
    }
  }, [leadId, formData, setFormData]);

  const handleCreateOrcamento = async (valorTotal: number) => {
    try {
      await createOrcamento(valorTotal);
      navigate("/dashboard/orcamentos");
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
    }
  };

  const handleCancel = () => {
    resetForm();
    navigate("/dashboard/orcamentos");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/orcamentos")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Orçamento</h1>
          <p className="text-muted-foreground">
            Crie um novo orçamento para um lead
          </p>
        </div>
      </div>

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
    </div>
  );
}
