import { PortasEnrolarCounter } from "@/components/producao/dashboard/PortasEnrolarCounter";
import { MateriaisRanking } from "@/components/producao/dashboard/MateriaisRanking";
import { PedidosStatusOrdens } from "@/components/producao/dashboard/PedidosStatusOrdens";
import { IndicadoresProducao } from "@/components/producao/dashboard/IndicadoresProducao";
import { CoresPintadasHoje } from "@/components/producao/dashboard/CoresPintadasHoje";

export default function ProducaoControle() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Produção</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe os indicadores e status de pedidos em tempo real
        </p>
      </div>

      {/* Novos Indicadores */}
      <IndicadoresProducao />

      {/* KPI: Portas de Enrolar Produzidas Hoje */}
      <PortasEnrolarCounter />

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking de Materiais */}
        <MateriaisRanking />

        {/* Pedidos com Ordens Pendentes */}
        <PedidosStatusOrdens />

        {/* Cores Pintadas Hoje */}
        <CoresPintadasHoje />
      </div>
    </div>
  );
}
