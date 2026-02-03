import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { MetaProgressoFlutuante } from "@/components/metas/MetaProgressoFlutuante";
import { useMetaProgresso } from "@/hooks/useMetaProgresso";
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

export default function SoldaMinimalista() {
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { tentarAvancoAutomatico, processos, modalOpen } = usePedidoAutoAvanco();
  const { metaInfo, visible, mostrarProgresso, fechar } = useMetaProgresso();

  const {
    ordens,
    ordensAFazer,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
    pausarOrdem,
    marcarLinhaComProblema,
    resolverProblemaLinha,
  } = useOrdemProducao('soldagem', tentarAvancoAutomatico);

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

  const handleConcluirOrdem = async (ordemId: string) => {
    await concluirOrdem.mutateAsync(ordemId);
    setSheetOpen(false);
    
    // Mostrar progresso da meta
    if (user?.id) {
      mostrarProgresso(user.id, 'soldagem');
    }
  };

  const handlePausarOrdem = async (ordemId: string, justificativa: string, linhasProblemaIds?: string[]) => {
    await pausarOrdem.mutateAsync({ ordemId, justificativa, linhasProblemaIds });
    setSheetOpen(false);
  };

  const handleMarcarLinhaProblema = (linhaId: string, ordemId: string, descricao: string) => {
    marcarLinhaComProblema.mutate({ linhaId, ordemId, descricao });
    setSheetOpen(false);
  };

  const handleResolverProblema = (linhaId: string) => {
    resolverProblemaLinha.mutate({ linhaId });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'soldagem'] });
  };

  return (
    <MinimalistLayout title="Solda" backPath="/fabrica/producao">
      <ProducaoKanban
        ordensAFazer={ordensAFazer}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onCapturarOrdem={handleCapturarOrdem}
        isCapturing={capturarOrdem.isPending}
        tipoOrdem="soldagem"
        onRefresh={handleRefresh}
        currentUserId={user?.id}
        currentUserRole={undefined}
      />

      <OrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tipoOrdem="soldagem"
        onMarcarLinha={handleMarcarLinha}
        onConcluirOrdem={handleConcluirOrdem}
        onCapturarOrdem={handleCapturarOrdem}
        isUpdating={marcarLinhaConcluida.isPending || concluirOrdem.isPending}
        isCapturing={capturarOrdem.isPending}
        onPausarOrdem={handlePausarOrdem}
        isPausing={pausarOrdem.isPending}
        onMarcarLinhaProblema={handleMarcarLinhaProblema}
        isMarkingProblem={marcarLinhaComProblema.isPending}
        onResolverProblemaLinha={handleResolverProblema}
        isResolvingProblem={resolverProblemaLinha.isPending}
      />

      <ProcessoAvancoAutomaticoModal
        open={modalOpen}
        processos={processos}
      />

      <MetaProgressoFlutuante
        metaInfo={metaInfo}
        visible={visible}
        onClose={fechar}
      />
    </MinimalistLayout>
  );
}
