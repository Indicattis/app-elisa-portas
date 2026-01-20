import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { CarregamentoDownbar } from "@/components/carregamento/CarregamentoDownbar";
import { CarregamentoKanban } from "@/components/carregamento/CarregamentoKanban";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { MinimalistLayout } from "@/components/MinimalistLayout";

type FiltroTipo = "todos" | "entrega" | "instalacao";

export default function CarregamentoMinimalista() {
  const { ordens, isLoading, concluirCarregamento } = useOrdensCarregamento();
  const queryClient = useQueryClient();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [itemSelecionado, setItemSelecionado] = useState<OrdemCarregamento | null>(null);
  const [downbarOpen, setDownbarOpen] = useState(false);

  // Filtrar todas as ordens não concluídas
  const ordensDisponiveis = ordens.filter(ordem => !ordem.carregamento_concluido);

  // Aplicar filtro por tipo de serviço (entrega ou instalação)
  const ordensFiltradas = ordensDisponiveis.filter(ordem => {
    if (filtroTipo === "todos") return true;
    return ordem.venda?.tipo_entrega === filtroTipo;
  });

  // Ordenar por data de carregamento
  const ordensOrdenadas = ordensFiltradas.sort((a, b) => {
    const dateA = a.data_carregamento ? new Date(a.data_carregamento).getTime() : 0;
    const dateB = b.data_carregamento ? new Date(b.data_carregamento).getTime() : 0;
    return dateA - dateB;
  });

  const handleIniciarColeta = (ordem: OrdemCarregamento) => {
    setItemSelecionado(ordem);
    setDownbarOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
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
            Todos ({ordensOrdenadas.length})
          </TabsTrigger>
          <TabsTrigger value="entrega" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Entrega ({ordensOrdenadas.filter(o => o.venda?.tipo_entrega === 'entrega').length})
          </TabsTrigger>
          <TabsTrigger value="instalacao" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Instalação ({ordensOrdenadas.filter(o => o.venda?.tipo_entrega === 'instalacao').length})
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
          onConcluir={concluirCarregamento}
          onSuccess={() => {
            setDownbarOpen(false);
            setItemSelecionado(null);
          }}
        />
      )}
    </MinimalistLayout>
  );
}
