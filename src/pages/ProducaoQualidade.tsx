import { useState } from "react";
import { useOrdemProducao } from "@/hooks/useOrdemProducao";
import { ProducaoKanban } from "@/components/production/ProducaoKanban";
import { OrdemDetalhesSheet } from "@/components/production/OrdemDetalhesSheet";
import { ClipboardCheck } from "lucide-react";

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  data_conclusao?: string;
  observacoes?: string;
  responsavel_id?: string;
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
    venda?: {
      id: string;
      numero_venda: string;
    };
  };
  linhas?: any[];
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export default function ProducaoQualidade() {
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
  } = useOrdemProducao('qualidade');

  // Sincronizar ordem selecionada com cache atualizado
  const ordemSelecionada = ordens.find(o => o.id === ordemSelecionadaId) || null;

  const handleOrdemClick = (ordem: Ordem) => {
    setOrdemSelecionadaId(ordem.id);
    setSheetOpen(true);
  };

  const handleMarcarLinha = async (linhaId: string, concluida: boolean) => {
    await marcarLinhaConcluida.mutateAsync({ linhaId, concluida });
  };

  const handleCapturarOrdem = async (ordemId: string) => {
    await capturarOrdem.mutateAsync(ordemId);
  };

  const handleConcluirOrdem = async (ordemId: string) => {
    await concluirOrdem.mutateAsync(ordemId);
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Inspeção de Qualidade</h1>
      </div>

      <ProducaoKanban
        ordensAFazer={ordensAFazer}
        ordensConcluidas={ordensConcluidas}
        isLoading={isLoading}
        onOrdemClick={handleOrdemClick}
        onCapturarOrdem={handleCapturarOrdem}
        isCapturing={capturarOrdem.isPending}
        tipoOrdem="qualidade"
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
    </div>
  );
}
