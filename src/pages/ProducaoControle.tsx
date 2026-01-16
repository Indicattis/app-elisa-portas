import { MateriaisRanking } from "@/components/producao/dashboard/MateriaisRanking";
import { PedidosEmProducaoReadOnly } from "@/components/producao/dashboard/PedidosEmProducaoReadOnly";
import { IndicadoresProducao } from "@/components/producao/dashboard/IndicadoresProducao";
import { CoresPintadasHoje } from "@/components/producao/dashboard/CoresPintadasHoje";
import { PortasPorEtapa } from "@/components/producao/dashboard/PortasPorEtapa";
import { MateriaisNecessariosProducao } from "@/components/producao/dashboard/MateriaisNecessariosProducao";
import { DesempenhoSetoresProducao } from "@/components/producao/dashboard/DesempenhoSetoresProducao";

export default function ProducaoControle() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Controle de Produção</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe os indicadores e status de pedidos em tempo real
        </p>
      </div>

      {/* Indicadores */}
      <IndicadoresProducao />

      {/* Portas por Etapa (Hoje) */}
      <PortasPorEtapa />

      {/* Pedidos em Produção (read-only) */}
      <PedidosEmProducaoReadOnly />

      {/* Desempenho por Setor com Gráfico */}
      <DesempenhoSetoresProducao />

      {/* Materiais Necessários para Produção */}
      <MateriaisNecessariosProducao />

      {/* Grid de Métricas - Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Ranking de Materiais */}
        <MateriaisRanking />

        {/* Cores Pintadas Hoje */}
        <CoresPintadasHoje />
      </div>
    </div>
  );
}
