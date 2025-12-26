import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrdemPortaSocial } from "@/hooks/useOrdemPortaSocial";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoTerceirizacaoKanban } from "@/components/production/ProducaoTerceirizacaoKanban";
import { DelegacaoModal } from "@/components/production/DelegacaoModal";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";

export default function ProducaoTerceirizacao() {
  const queryClient = useQueryClient();
  const [delegacaoOrdemId, setDelegacaoOrdemId] = useState<string | null>(null);

  const { tentarAvancoAutomatico, processos, modalOpen, setModalOpen } = usePedidoAutoAvanco();

  const { ordensAFazer, isLoading, delegarOrdem, concluirOrdem } = useOrdemPortaSocial(
    (pedidoId) => tentarAvancoAutomatico(pedidoId, 'porta_social' as any)
  );

  const handleDelegarOrdem = (ordemId: string) => {
    setDelegacaoOrdemId(ordemId);
  };

  const handleConfirmDelegacao = (userId: string) => {
    if (delegacaoOrdemId) {
      delegarOrdem.mutate(
        { ordemId: delegacaoOrdemId, userId },
        {
          onSuccess: () => {
            setDelegacaoOrdemId(null);
          },
        }
      );
    }
  };

  const handleConcluirOrdem = (ordemId: string) => {
    concluirOrdem.mutate(ordemId);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ordens-porta-social"] });
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <ProducaoTerceirizacaoKanban
        ordensAFazer={ordensAFazer}
        isLoading={isLoading}
        onDelegarOrdem={handleDelegarOrdem}
        onConcluirOrdem={handleConcluirOrdem}
        isDelegating={delegarOrdem.isPending}
        isConcluindo={concluirOrdem.isPending}
        onRefresh={handleRefresh}
      />

      {/* Modal de Delegação */}
      <DelegacaoModal
        open={!!delegacaoOrdemId}
        onOpenChange={(open) => !open && setDelegacaoOrdemId(null)}
        onConfirm={handleConfirmDelegacao}
        isLoading={delegarOrdem.isPending}
      />

      {/* Modal de Avanço Automático */}
      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />
    </div>
  );
}
