import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { usePedidoAutoAvanco } from "@/hooks/usePedidoAutoAvanco";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ProcessoAvancoAutomaticoModal } from "@/components/pedidos/ProcessoAvancoAutomaticoModal";
import { MetaProgressoFlutuante } from "@/components/metas/MetaProgressoFlutuante";
import { useMetaProgresso } from "@/hooks/useMetaProgresso";
import { useQueryClient } from "@tanstack/react-query";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";

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

export default function ProducaoPerfiladeira() {
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useProducaoAuth();

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
  } = useOrdemProducao('perfiladeira', tentarAvancoAutomatico);

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

  const handleConcluirOrdem = async (ordemId: string) => {
    await concluirOrdem.mutateAsync(ordemId);
    setSheetOpen(false);
    
    // Mostrar progresso da meta
    if (user?.user_id) {
      mostrarProgresso(user.user_id, 'perfiladeira');
    }
  };

  const handlePausarOrdem = async (ordemId: string, justificativa: string, linhasProblemaIds?: string[]) => {
    await pausarOrdem.mutateAsync({ ordemId, justificativa, linhasProblemaIds });
    setSheetOpen(false);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-producao', 'perfiladeira'] });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ProducaoKanban
        ordensAFazer={ordensAFazer}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onCapturarOrdem={handleCapturarOrdem}
        isCapturing={capturarOrdem.isPending}
        tipoOrdem="perfiladeira"
        onRefresh={handleRefresh}
        currentUserId={user?.user_id}
        currentUserRole={user?.role}
      />

      <OrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tipoOrdem="perfiladeira"
        onMarcarLinha={handleMarcarLinha}
        onConcluirOrdem={handleConcluirOrdem}
        onCapturarOrdem={handleCapturarOrdem}
        onPausarOrdem={handlePausarOrdem}
        isPausing={pausarOrdem.isPending}
        isUpdating={marcarLinhaConcluida.isPending || concluirOrdem.isPending}
        isCapturing={capturarOrdem.isPending}
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
    </div>
  );
}
