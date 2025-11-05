import { useState } from "react";
import { Paintbrush } from "lucide-react";
import { useOrdemPintura } from "@/hooks/useOrdemPintura";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";

export default function ProducaoPintura() {
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    ordens,
    ordensParaPintar,
    ordensProntas,
    isLoading,
    capturarOrdem,
    finalizarPintura,
    marcarLinhaConcluida,
  } = useOrdemPintura();

  // Sincronizar ordem selecionada com cache atualizado
  const selectedOrdem = ordens.find(o => o.id === selectedOrdemId) || null;

  const handleOrdemClick = (ordem: any) => {
    setSelectedOrdemId(ordem.id);
    setDetailsOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Paintbrush className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Produção - Pintura</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de pintura: Para Pintar e Pronta
          </p>
        </div>
      </div>

      <ProducaoPinturaKanban
        ordensParaPintar={ordensParaPintar}
        ordensProntas={ordensProntas}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onFinalizarPintura={finalizarPintura.mutate}
        onCapturarOrdem={capturarOrdem.mutate}
        isCapturing={capturarOrdem.isPending}
      />

      <OrdemDetalhesSheet
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        tipoOrdem="pintura"
        onMarcarLinha={(linhaId, concluida) => 
          marcarLinhaConcluida.mutate({ linhaId, concluida })
        }
        onConcluirOrdem={() => {}}
        onCapturarOrdem={(ordemId) => capturarOrdem.mutate(ordemId)}
        isUpdating={marcarLinhaConcluida.isPending}
        isCapturing={capturarOrdem.isPending}
        onFinalizarPintura={() => finalizarPintura.mutate(selectedOrdem?.id || '')}
        isFinalizando={finalizarPintura.isPending}
      />
    </div>
  );
}
