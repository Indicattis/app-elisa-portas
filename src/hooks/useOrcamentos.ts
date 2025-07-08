
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrcamentoData } from "./useOrcamentoData";
import { useOrcamentoFilters } from "./useOrcamentoFilters";
import { useOrcamentoForm } from "./useOrcamentoForm";
import { createOrcamento, approveOrcamento, rejectOrcamento } from "@/services/orcamentoService";

export function useOrcamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sempre chame os hooks na mesma ordem, independente dos dados
  const { leads, orcamentos, fetchOrcamentos } = useOrcamentoData();
  const { formData, setFormData, camposPersonalizados, setCamposPersonalizados, resetForm } = useOrcamentoForm();
  const { filters, setFilters, filteredOrcamentos } = useOrcamentoFilters(orcamentos);

  const handleCreateOrcamento = async (valorTotal: number) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await createOrcamento(formData, camposPersonalizados, valorTotal, user.id);

      toast({
        title: "Sucesso",
        description: `Orçamento ${formData.requer_analise ? 'criado e enviado para análise' : 'criado e aprovado automaticamente'}`,
      });

      resetForm();
      fetchOrcamentos();

      return data;
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar orçamento",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrcamento = async (orcamentoId: string, desconto_adicional: number, tipo_desconto: string, observacoes: string) => {
    try {
      await approveOrcamento(orcamentoId, desconto_adicional, tipo_desconto, observacoes);

      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aprovar orçamento",
      });
      throw error;
    }
  };

  const handleRejectOrcamento = async (orcamentoId: string) => {
    try {
      await rejectOrcamento(orcamentoId);

      toast({
        title: "Sucesso",
        description: "Orçamento reprovado",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao reprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao reprovar orçamento",
      });
      throw error;
    }
  };

  return {
    leads,
    orcamentos,
    filteredOrcamentos,
    loading,
    filters,
    setFilters,
    formData,
    setFormData,
    camposPersonalizados,
    setCamposPersonalizados,
    createOrcamento: handleCreateOrcamento,
    approveOrcamento: handleApproveOrcamento,
    rejectOrcamento: handleRejectOrcamento,
    resetForm,
    fetchOrcamentos
  };
}
