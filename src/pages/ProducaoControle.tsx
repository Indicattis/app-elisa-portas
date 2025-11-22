import { PortasEnrolarCounter } from "@/components/producao/dashboard/PortasEnrolarCounter";
import { MateriaisRanking } from "@/components/producao/dashboard/MateriaisRanking";
import { PedidosStatusOrdens } from "@/components/producao/dashboard/PedidosStatusOrdens";

export default function ProducaoControle() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Produção</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe os indicadores e status de pedidos em tempo real
        </p>
      </div>

      {/* KPI: Portas de Enrolar Produzidas Hoje */}
      <PortasEnrolarCounter />

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Materiais */}
        <MateriaisRanking />

        {/* Pedidos com Ordens Pendentes */}
        <PedidosStatusOrdens />
      </div>
    </div>
  );
}
