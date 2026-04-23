import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { useOrdemEmbalagem } from "@/hooks/useOrdemEmbalagem";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { Button } from "@/components/ui/button";
import { MinimalistLayout } from "@/components/MinimalistLayout";

export default function EmbalagemMinimalista() {
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();

  const {
    ordens,
    ordensPendentes,
    isLoading,
    capturarOrdem,
    finalizarEmbalagem,
    marcarLinhaConcluida,
    pausarOrdem,
  } = useOrdemEmbalagem(tentarAvancoAutomatico);

  const selectedOrdem = ordens.find(o => o.id === selectedOrdemId) || null;

  const handleOrdemClick = (ordem: any) => {
    setSelectedOrdemId(ordem.id);
    setDetailsOpen(true);
  };

  const handleFinalizarEmbalagem = async () => {
    if (!selectedOrdem) return;
    await finalizarEmbalagem.mutateAsync(selectedOrdem.id);
    setDetailsOpen(false);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-embalagem'] });
  };

  const headerActions = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );

  return (
    <MinimalistLayout title="Embalagem" backPath="/fabrica/producao" headerActions={headerActions}>
      <ProducaoPinturaKanban
        ordensParaPintar={ordensPendentes}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onFinalizarPintura={finalizarEmbalagem.mutate}
        onCapturarOrdem={capturarOrdem.mutate}
        isCapturing={capturarOrdem.isPending}
      />

      <OrdemDetalhesSheet
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        tipoOrdem="embalagem"
        onMarcarLinha={(linhaId, concluida) =>
          marcarLinhaConcluida.mutate({ linhaId, concluida })
        }
        onConcluirOrdem={() => {}}
        onCapturarOrdem={(ordemId) => capturarOrdem.mutate(ordemId)}
        isUpdating={marcarLinhaConcluida.isPending}
        isCapturing={capturarOrdem.isPending}
        onFinalizarPintura={handleFinalizarEmbalagem}
        isFinalizando={finalizarEmbalagem.isPending}
        onPausarOrdem={async (ordemId, justificativa, linhasIds, comentarioPedido) => {
          await pausarOrdem.mutateAsync({ ordemId, justificativa, linhasProblemaIds: linhasIds, comentarioPedido });
          setDetailsOpen(false);
        }}
        isPausing={pausarOrdem.isPending}
      />

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />
    </MinimalistLayout>
  );
}
