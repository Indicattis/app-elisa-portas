import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MinimalistLayout } from "@/components/MinimalistLayout";

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

export default function QualidadeMinimalista() {
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();

  const {
    ordens,
    ordensAFazer,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
  } = useOrdemProducao('qualidade', tentarAvancoAutomatico);

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'qualidade'] });
  };

  return (
    <MinimalistLayout title="Qualidade" backPath="/fabrica/producao">
      <ProducaoKanban
        ordensAFazer={ordensAFazer}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onCapturarOrdem={handleCapturarOrdem}
        isCapturing={capturarOrdem.isPending}
        tipoOrdem="qualidade"
        onRefresh={handleRefresh}
        currentUserId={user?.id}
        currentUserRole={undefined}
      />

      <OrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tipoOrdem="qualidade"
        onMarcarLinha={handleMarcarLinha}
        onConcluirOrdem={handleConcluirOrdem}
        onCapturarOrdem={handleCapturarOrdem}
        isUpdating={marcarLinhaConcluida.isPending || concluirOrdem.isPending}
        isCapturing={capturarOrdem.isPending}
      />

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />
    </MinimalistLayout>
  );
}
