import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageCheck, Truck } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { CarregamentoDownbar } from "@/components/carregamento/CarregamentoDownbar";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { CarregamentoKanban } from "@/components/carregamento/CarregamentoKanban";
import { useQueryClient } from "@tanstack/react-query";

type FiltroTipo = "todos" | "elisa" | "autorizados";

export default function ProducaoCarregamento() {
  const { ordens, isLoading, concluirCarregamento } = useOrdensCarregamento();
  const queryClient = useQueryClient();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [itemSelecionado, setItemSelecionado] = useState<OrdemCarregamento | null>(null);
  const [downbarOpen, setDownbarOpen] = useState(false);

  // Filtrar ordens pendentes ou agendadas (não concluídas)
  const ordensDisponiveis = ordens.filter(ordem => 
    !ordem.carregamento_concluido && 
    (ordem.status === 'pendente' || ordem.status === 'agendada')
  );

  // Aplicar filtro por tipo de carregamento
  const ordensFiltradas = ordensDisponiveis.filter(ordem => {
    if (filtroTipo === "todos") return true;
    return ordem.tipo_carregamento === filtroTipo;
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Filtro por tipo de carregamento */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="todos">
            Todos ({ordensOrdenadas.length})
          </TabsTrigger>
          <TabsTrigger value="elisa">
            <Truck className="h-4 w-4 mr-2" />
            Elisa ({ordensOrdenadas.filter(o => o.tipo_carregamento === 'elisa').length})
          </TabsTrigger>
          <TabsTrigger value="autorizados">
            <PackageCheck className="h-4 w-4 mr-2" />
            Autorizados ({ordensOrdenadas.filter(o => o.tipo_carregamento === 'autorizados').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Kanban de Ordens */}
      <CarregamentoKanban
        ordens={ordensOrdenadas}
        isLoading={isLoading}
        onIniciarColeta={handleIniciarColeta}
        onRefresh={handleRefresh}
      />

      {/* Downbar para confirmar carregamento */}
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
    </div>
  );
}
