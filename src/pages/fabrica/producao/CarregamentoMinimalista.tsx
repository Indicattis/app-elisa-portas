import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wrench } from "lucide-react";
import { useOrdensCarregamentoUnificadas, OrdemCarregamentoUnificada } from "@/hooks/useOrdensCarregamentoUnificadas";
import { CarregamentoDownbar } from "@/components/carregamento/CarregamentoDownbar";
import { CarregamentoKanban } from "@/components/carregamento/CarregamentoKanban";
import { MetaProgressoFlutuante } from "@/components/metas/MetaProgressoFlutuante";
import { useMetaProgresso } from "@/hooks/useMetaProgresso";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useAuth } from "@/hooks/useAuth";

type FiltroTipo = "todos" | "entrega" | "instalacao" | "correcoes";

export default function CarregamentoMinimalista() {
  const { ordens, isLoading, concluirCarregamento } = useOrdensCarregamentoUnificadas();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [itemSelecionado, setItemSelecionado] = useState<OrdemCarregamentoUnificada | null>(null);
  const [downbarOpen, setDownbarOpen] = useState(false);
  const { metaInfo, visible, mostrarProgresso, fechar } = useMetaProgresso();

  // Filtrar todas as ordens não concluídas (já filtrado pelo hook)
  const ordensDisponiveis = ordens;

  // Aplicar filtro por tipo de serviço (entrega ou instalação)
  const ordensFiltradas = ordensDisponiveis.filter(ordem => {
    if (filtroTipo === "todos") return true;
    if (filtroTipo === "correcoes") return ordem.fonte === 'correcoes';
    if (filtroTipo === "instalacao") {
      return ordem.tipo_entrega === 'instalacao' || ordem.tipo_entrega === 'manutencao';
    }
    return ordem.tipo_entrega === filtroTipo;
  });

  // Ordenar por data de carregamento
  const ordensOrdenadas = ordensFiltradas.sort((a, b) => {
    const dateA = a.data_carregamento ? new Date(a.data_carregamento + 'T12:00:00').getTime() : 0;
    const dateB = b.data_carregamento ? new Date(b.data_carregamento + 'T12:00:00').getTime() : 0;
    return dateA - dateB;
  });

  const handleIniciarColeta = (ordem: OrdemCarregamentoUnificada) => {
    setItemSelecionado(ordem);
    setDownbarOpen(true);
  };

  const handleConcluirCarregamento = async ({ observacoes, fotoFile }: { observacoes?: string; fotoFile?: File }) => {
    if (!itemSelecionado) return;
    await concluirCarregamento({ ordem: itemSelecionado, observacoes, fotoFile });
    
    // Mostrar progresso da meta
    if (user?.id) {
      mostrarProgresso(user.id, 'carregamento');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_unificadas"] });
  };

  const headerActions = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );

  return (
    <MinimalistLayout title="Carregamento" backPath="/fabrica/producao" headerActions={headerActions}>
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-4">
          <TabsTrigger value="todos" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Todos ({ordensDisponiveis.length})
          </TabsTrigger>
          <TabsTrigger value="entrega" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Entrega ({ordensDisponiveis.filter(o => o.tipo_entrega === 'entrega').length})
          </TabsTrigger>
          <TabsTrigger value="instalacao" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Instalação ({ordensDisponiveis.filter(o => o.tipo_entrega === 'instalacao' || o.tipo_entrega === 'manutencao').length})
          </TabsTrigger>
          <TabsTrigger value="correcoes" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Wrench className="h-4 w-4 mr-1" />
            Correções ({ordensDisponiveis.filter(o => o.fonte === 'correcoes').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <CarregamentoKanban
        ordens={ordensOrdenadas}
        isLoading={isLoading}
        onIniciarColeta={handleIniciarColeta}
        onRefresh={handleRefresh}
      />

      {itemSelecionado && (
        <CarregamentoDownbar
          ordem={itemSelecionado}
          open={downbarOpen}
          onOpenChange={setDownbarOpen}
          onConcluir={handleConcluirCarregamento}
          onSuccess={() => {
            setDownbarOpen(false);
            setItemSelecionado(null);
          }}
        />
      )}

      <MetaProgressoFlutuante
        metaInfo={metaInfo}
        visible={visible}
        onClose={fechar}
      />
    </MinimalistLayout>
  );
}
