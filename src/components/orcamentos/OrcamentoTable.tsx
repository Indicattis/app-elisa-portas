
import { useState } from "react";
import { OrcamentoCard } from "./OrcamentoCard";
import { OrcamentoStatusModal } from "./OrcamentoStatusModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MotivoPerda } from "@/types/orcamento";

interface OrcamentoTableProps {
  orcamentos: any[];
  onEdit?: (orcamento: any) => void;
  onRefresh?: () => void;
}

export function OrcamentoTable({ orcamentos, onEdit, onRefresh }: OrcamentoTableProps) {
  const { toast } = useToast();
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusChange = async (orcamentoId: string, novoStatus: number, motivoPerda?: MotivoPerda, justificativa?: string) => {
    try {
      const updateData: any = { 
        status: getStatusString(novoStatus)
      };

      if (novoStatus === 3 && motivoPerda && justificativa) {
        updateData.motivo_perda = motivoPerda;
        updateData.justificativa_perda = justificativa;
      }

      const { error } = await supabase
        .from("orcamentos")
        .update(updateData)
        .eq("id", orcamentoId);

      if (error) throw error;

      // Se status foi alterado para "Vendido", criar requisição de venda
      if (novoStatus === 4) {
        const orcamento = orcamentos.find(o => o.id === orcamentoId);
        if (orcamento) {
          const { error: reqError } = await supabase.rpc('criar_requisicao_venda', {
            orcamento_uuid: orcamentoId
          });

          if (reqError) throw reqError;

          toast({
            title: "Sucesso",
            description: "Orçamento vendido e requisição de venda criada",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Status do orçamento atualizado",
        });
      }

      onRefresh?.();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status do orçamento",
      });
    }
  };

  const getStatusString = (number: number) => {
    const statusMap: { [key: number]: string } = {
      1: 'pendente',
      2: 'congelado',
      3: 'perdido',
      4: 'vendido',
      5: 'reprovado'
    };
    return statusMap[number] || 'pendente';
  };

  const handleCardStatusChange = (orcamento: any) => {
    setSelectedOrcamento(orcamento);
    setShowStatusModal(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orcamentos.map((orcamento) => (
          <OrcamentoCard
            key={orcamento.id}
            orcamento={orcamento}
            onEdit={onEdit}
            onStatusChange={handleCardStatusChange}
          />
        ))}
      </div>

      {selectedOrcamento && (
        <OrcamentoStatusModal
          orcamento={selectedOrcamento}
          open={showStatusModal}
          onOpenChange={setShowStatusModal}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}
