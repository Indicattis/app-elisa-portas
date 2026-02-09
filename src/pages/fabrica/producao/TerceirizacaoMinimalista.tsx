import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrdemPortaSocial } from "@/hooks/useOrdemPortaSocial";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoTerceirizacaoKanban } from "@/components/production/ProducaoTerceirizacaoKanban";
import { DelegacaoModal } from "@/components/production/DelegacaoModal";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { MinimalistLayout } from "@/components/MinimalistLayout";

export default function TerceirizacaoMinimalista() {
  const queryClient = useQueryClient();
  const [delegacaoOrdemId, setDelegacaoOrdemId] = useState<string | null>(null);

  const { tentarAvancoAutomatico, processos, modalOpen, setModalOpen } = usePedidoAutoAvanco();

  const { ordensAFazer, isLoading, delegarOrdem, concluirOrdem } = useOrdemPortaSocial(
    (pedidoId) => tentarAvancoAutomatico(pedidoId, 'porta_social')
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
    <MinimalistLayout title="Terceirização" backPath="/fabrica/producao">
      <ProducaoTerceirizacaoKanban
        ordensAFazer={ordensAFazer}
        isLoading={isLoading}
        onDelegarOrdem={handleDelegarOrdem}
        onConcluirOrdem={handleConcluirOrdem}
        isDelegating={delegarOrdem.isPending}
        isConcluindo={concluirOrdem.isPending}
        onRefresh={handleRefresh}
      />

      <DelegacaoModal
        open={!!delegacaoOrdemId}
        onOpenChange={(open) => !open && setDelegacaoOrdemId(null)}
        onConfirm={handleConfirmDelegacao}
        isLoading={delegarOrdem.isPending}
      />

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />
    </MinimalistLayout>
  );
}
