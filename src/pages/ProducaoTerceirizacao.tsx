import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrdemPortaSocial } from "@/hooks/useOrdemPortaSocial";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import {
  ProducaoTerceirizacaoKanban,
  type OrdemPortaSocial,
} from "@/components/production/ProducaoTerceirizacaoKanban";
import { DelegacaoModal } from "@/components/production/DelegacaoModal";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { TerceirizacaoDownbar } from "@/components/production/TerceirizacaoDownbar";

export default function ProducaoTerceirizacao() {
  const queryClient = useQueryClient();
  const [delegacaoOrdemId, setDelegacaoOrdemId] = useState<string | null>(null);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemPortaSocial | null>(null);

  const { tentarAvancoAutomatico, processos, modalOpen, setModalOpen } = usePedidoAutoAvanco();

  const { ordensAFazer, isLoading, delegarOrdem, concluirOrdem } = useOrdemPortaSocial(
    (pedidoId) => tentarAvancoAutomatico(pedidoId, "porta_social")
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

  const handleCardClick = (ordem: OrdemPortaSocial) => {
    setOrdemSelecionada(ordem);
  };

  const handleConcluirOrdem = (ordemId: string) => {
    concluirOrdem.mutate(ordemId, {
      onSuccess: () => {
        setOrdemSelecionada(null);
      },
    });
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
        onCardClick={handleCardClick}
        isDelegating={delegarOrdem.isPending}
        onRefresh={handleRefresh}
      />

      {/* Modal de Delegação */}
      <DelegacaoModal
        open={!!delegacaoOrdemId}
        onOpenChange={(open) => !open && setDelegacaoOrdemId(null)}
        onConfirm={handleConfirmDelegacao}
        isLoading={delegarOrdem.isPending}
      />

      {/* Downbar de detalhes / conclusão */}
      <TerceirizacaoDownbar
        ordem={ordemSelecionada}
        open={!!ordemSelecionada}
        onOpenChange={(open) => {
          if (!open) setOrdemSelecionada(null);
        }}
        onConcluir={handleConcluirOrdem}
        isConcluindo={concluirOrdem.isPending}
      />

      {/* Modal de Avanço Automático */}
      <ProcessoAvancoAutomaticoModal open={modalOpen} processos={processos} />
    </div>
  );
}
