import { useState } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { useOrdemPintura } from "@/hooks/useOrdemPintura";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { usePinturaInicios } from "@/hooks/usePinturaInicios";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { NovoInicioPinturaModal } from "@/components/production/NovoInicioPinturaModal";
import { PinturaIniciosList } from "@/components/production/PinturaIniciosList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

export default function ProducaoPintura() {
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [novoInicioOpen, setNovoInicioOpen] = useState(false);
  const queryClient = useQueryClient();

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();
  const { inicios, isLoading: isLoadingInicios, criarInicio, toggleRecarga } = usePinturaInicios();

  const {
    ordens,
    ordensParaPintar,
    isLoading,
    capturarOrdem,
    finalizarPintura,
    marcarLinhaConcluida,
  } = useOrdemPintura(tentarAvancoAutomatico);

  // Sincronizar ordem selecionada com cache atualizado
  const selectedOrdem = ordens.find(o => o.id === selectedOrdemId) || null;

  const handleOrdemClick = (ordem: any) => {
    setSelectedOrdemId(ordem.id);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
    queryClient.invalidateQueries({ queryKey: ['pintura-inicios'] });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="ordens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ordens">Ordens de Pintura</TabsTrigger>
          <TabsTrigger value="controle">Controle de Fornadas</TabsTrigger>
        </TabsList>

        <TabsContent value="ordens" className="space-y-6">
          <ProducaoPinturaKanban
            ordensParaPintar={ordensParaPintar}
            isLoading={isLoading}
            onOrdemClick={handleOrdemClick}
            onFinalizarPintura={finalizarPintura.mutate}
            onCapturarOrdem={capturarOrdem.mutate}
            isCapturing={capturarOrdem.isPending}
          />
        </TabsContent>

        <TabsContent value="controle" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovoInicioOpen(true)} className="gap-2">
              <Flame className="h-4 w-4" />
              Registrar Fornada
            </Button>
          </div>
          <PinturaIniciosList 
            inicios={inicios} 
            isLoading={isLoadingInicios}
            onToggleRecarga={toggleRecarga.mutate}
            isTogglingRecarga={toggleRecarga.isPending}
          />
        </TabsContent>
      </Tabs>

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

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />

      <NovoInicioPinturaModal
        open={novoInicioOpen}
        onOpenChange={setNovoInicioOpen}
        onConfirm={criarInicio.mutate}
        isLoading={criarInicio.isPending}
      />
    </div>
  );
}
