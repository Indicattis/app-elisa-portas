import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { Settings } from "lucide-react";

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  observacoes?: string;
  linhas?: any[];
  pedido?: {
    cliente_nome: string;
  };
}

export default function ProducaoPerfiladeira() {
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    ordens,
    ordensAFazer,
    ordensConcluidas,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
  } = useOrdemProducao('perfiladeira');

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Settings className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Perfiladeira</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de perfiladeira em produção
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
        tipoOrdem="perfiladeira"
      />

      <OrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tipoOrdem="perfiladeira"
        onMarcarLinha={handleMarcarLinha}
        onConcluirOrdem={handleConcluirOrdem}
        isUpdating={marcarLinhaConcluida.isPending || concluirOrdem.isPending}
      />
    </div>
  );
}
