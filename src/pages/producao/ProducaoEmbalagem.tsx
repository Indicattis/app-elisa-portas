import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { useOrdemEmbalagem } from "@/hooks/useOrdemEmbalagem";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { Button } from "@/components/ui/button";

export default function ProducaoEmbalagem() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Embalagem</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

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
    </div>
  );
}
