import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { Package } from "lucide-react";

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  observacoes?: string;
  linhas?: any[];
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
  };
}

export default function ProducaoSeparacao() {
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();

  const {
    ordens,
    ordensAFazer,
    ordensConcluidas,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
    enviarParaHistorico,
  } = useOrdemProducao('separacao', tentarAvancoAutomatico);

  // Sincronizar ordem selecionada com cache atualizado
  const ordemSelecionada = ordens.find(o => o.id === ordemSelecionadaId) || null;

  const handleOrdemClick = (ordem: Ordem) => {
    setOrdemSelecionadaId(ordem.id);
    setSheetOpen(true);
  };

  const handleMarcarLinha = (linhaId: string, concluida: boolean) => {
    marcarLinhaConcluida.mutate({ linhaId, concluida });
  };

  const handleCapturarOrdem = async (ordemId: string) => {
    await capturarOrdem.mutateAsync(ordemId);
  };

  const handleConcluirOrdem = (ordemId: string) => {
    concluirOrdem.mutate(ordemId);
    setSheetOpen(false);
  };

  const handleEnviarParaHistorico = async (ordemId: string) => {
    await enviarParaHistorico.mutateAsync(ordemId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Package className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Separação</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de separação em produção
          </p>
        </div>
      </div>

      <ProducaoKanban
        ordensAFazer={ordensAFazer}
        ordensConcluidas={ordensConcluidas}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onCapturarOrdem={handleCapturarOrdem}
        isCapturing={capturarOrdem.isPending}
        tipoOrdem="separacao"
        onEnviarParaHistorico={handleEnviarParaHistorico}
        isEnviandoHistorico={enviarParaHistorico.isPending}
      />

      <OrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tipoOrdem="separacao"
        onMarcarLinha={handleMarcarLinha}
        onConcluirOrdem={handleConcluirOrdem}
        onCapturarOrdem={handleCapturarOrdem}
        onEnviarParaHistorico={handleEnviarParaHistorico}
        isUpdating={marcarLinhaConcluida.isPending || concluirOrdem.isPending}
        isCapturing={capturarOrdem.isPending}
        isEnviandoHistorico={enviarParaHistorico.isPending}
      />

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />
    </div>
  );
}
