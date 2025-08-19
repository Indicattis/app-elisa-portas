
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { NovoOrcamentoForm } from "@/components/orcamentos/NovoOrcamentoForm";

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");

  const { loading, createOrcamento } = useOrcamentos();

  const handleCreateOrcamento = async (formData: any, produtos: any[], custos: any[], valorTotal: number) => {
    try {
      await createOrcamento(formData, produtos, custos, valorTotal);
      navigate("/dashboard/orcamentos");
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
    }
  };

  const handleCancel = () => {
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

      <NovoOrcamentoForm
        onSubmit={handleCreateOrcamento}
        onCancel={handleCancel}
        loading={loading}
        leadId={leadId}
      />
    </div>
  );
}
