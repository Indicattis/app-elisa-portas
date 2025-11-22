import { useState } from "react";
import { Paintbrush, Flame, RefreshCw, History } from "lucide-react";
import { useOrdemPintura } from "@/hooks/useOrdemPintura";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { usePinturaInicios } from "@/hooks/usePinturaInicios";
import { ProducaoPinturaKanban } from "@/components/production/ProducaoPinturaKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { NovoInicioPinturaModal } from "@/components/production/NovoInicioPinturaModal";
import { PinturaIniciosList } from "@/components/production/PinturaIniciosList";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Archive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProducaoPintura() {
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [novoInicioOpen, setNovoInicioOpen] = useState(false);
  const [concluidasOpen, setConcluidasOpen] = useState(false);
  const queryClient = useQueryClient();

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();
  const { inicios, isLoading: isLoadingInicios, criarInicio, toggleRecarga } = usePinturaInicios();

  const {
    ordens,
    ordensParaPintar,
    ordensProntas,
    isLoading,
    capturarOrdem,
    finalizarPintura,
    marcarLinhaConcluida,
    enviarParaHistorico,
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

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setConcluidasOpen(true)} variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Concluídas ({ordensProntas.length})
          </Button>
          <Button onClick={() => setNovoInicioOpen(true)} className="gap-2">
            <Flame className="h-4 w-4" />
            Registrar Início
          </Button>
        </div>
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

        <TabsContent value="controle">
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

      <Dialog open={concluidasOpen} onOpenChange={setConcluidasOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Ordens Concluídas
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ordensProntas.map((ordem) => (
                <Card 
                  key={ordem.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedOrdemId(ordem.id);
                    setDetailsOpen(true);
                    setConcluidasOpen(false);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {ordem.numero_ordem}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {ordem.pedido?.cliente_nome}
                        </p>
                      </div>
                      <Badge variant="default">Pronta</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ordem.admin_users && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ordem.admin_users.foto_perfil_url} alt={ordem.admin_users.nome} />
                          <AvatarFallback className="text-sm">
                            {ordem.admin_users.nome?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground truncate">
                          {ordem.admin_users.nome}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        enviarParaHistorico.mutate(ordem.id);
                      }}
                      disabled={enviarParaHistorico.isPending}
                    >
                      <Archive className="h-3 w-3 mr-2" />
                      Enviar para Histórico
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {ordensProntas.length === 0 && (
                <Card className="border-dashed col-span-full">
                  <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhuma ordem concluída
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
