import { useState } from "react";
import { Paintbrush, Flame } from "lucide-react";
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

export default function ProducaoPintura() {
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [novoInicioOpen, setNovoInicioOpen] = useState(false);

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();
  const { inicios, isLoading: isLoadingInicios, criarInicio } = usePinturaInicios();

  const {
    ordens,
    ordensParaPintar,
    ordensProntas,
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Paintbrush className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Produção - Pintura</h1>
            <p className="text-muted-foreground">
              Gerencie as ordens de pintura e controle o forno
            </p>
          </div>
        </div>

        <Button onClick={() => setNovoInicioOpen(true)} className="gap-2">
          <Flame className="h-4 w-4" />
          Registrar Início
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
            ordensProntas={ordensProntas}
            isLoading={isLoading}
            onOrdemClick={handleOrdemClick}
            onFinalizarPintura={finalizarPintura.mutate}
            onCapturarOrdem={capturarOrdem.mutate}
            isCapturing={capturarOrdem.isPending}
          />
        </TabsContent>

        <TabsContent value="controle">
          <PinturaIniciosList inicios={inicios} isLoading={isLoadingInicios} />
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
