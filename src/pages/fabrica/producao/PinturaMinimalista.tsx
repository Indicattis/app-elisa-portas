import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, RefreshCw } from "lucide-react";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { usePinturaInicios } from "@/hooks/usePinturaInicios";
import { useOrdemPintura } from "@/hooks/useOrdemPintura";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { PinturaIniciosList } from "@/components/production/PinturaIniciosList";
import { NovoInicioPinturaModal } from "@/components/production/NovoInicioPinturaModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MinimalistLayout } from "@/components/MinimalistLayout";

export default function PinturaMinimalista() {
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

  const selectedOrdem = ordens.find(o => o.id === selectedOrdemId) || null;

  const handleOrdemClick = (ordem: any) => {
    setSelectedOrdemId(ordem.id);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
    queryClient.invalidateQueries({ queryKey: ['pintura-inicios'] });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        className="text-white/70 hover:text-white hover:bg-white/10"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setNovoInicioOpen(true)}
        className="text-white/70 hover:text-white hover:bg-white/10"
      >
        <Flame className="h-4 w-4 mr-2" />
        Registrar Fornada
      </Button>
    </div>
  );

  return (
    <MinimalistLayout title="Pintura" backPath="/fabrica/producao" headerActions={headerActions}>
      <Tabs defaultValue="ordens" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="ordens" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Ordens de Pintura
          </TabsTrigger>
          <TabsTrigger value="controle" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Controle de Fornadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordens" className="mt-4">
          <ProducaoPinturaKanban
            ordensParaPintar={ordensParaPintar}
            isLoading={isLoading}
            onOrdemClick={handleOrdemClick}
            onFinalizarPintura={finalizarPintura.mutate}
            onCapturarOrdem={capturarOrdem.mutate}
            isCapturing={capturarOrdem.isPending}
          />
        </TabsContent>

        <TabsContent value="controle" className="mt-4">
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
    </MinimalistLayout>
  );
}
