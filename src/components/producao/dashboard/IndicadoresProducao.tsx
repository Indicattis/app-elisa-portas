import { Card, CardContent } from "@/components/ui/card";
import { Package, Target, Clock, AlertCircle } from "lucide-react";
import { usePortasEnrolarProduzidasMes } from "@/hooks/usePortasEnrolarProduzidasMes";
import { useMetaProducaoMes } from "@/hooks/useMetaProducaoMes";
import { usePedidosNaFila } from "@/hooks/usePedidosNaFila";
import { useOrdensParadas } from "@/hooks/useOrdensParadas";

export function IndicadoresProducao() {
  const { data: portasMes = 0, isLoading: loadingPortas } = usePortasEnrolarProduzidasMes();
  const { data: metaMes = 0, isLoading: loadingMeta } = useMetaProducaoMes();
  const { data: pedidosFila = 0, isLoading: loadingFila } = usePedidosNaFila();
  const { data: ordensParadas = 0, isLoading: loadingParadas } = useOrdensParadas();

  const indicadores = [
    {
      titulo: "Portas Produzidas no Mês",
      valor: portasMes,
      icon: Package,
      loading: loadingPortas,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      titulo: "Meta de Produção do Mês",
      valor: metaMes,
      icon: Target,
      loading: loadingMeta,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      titulo: "Pedidos na Fila",
      valor: pedidosFila,
      icon: Clock,
      loading: loadingFila,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      titulo: "Ordens Paradas",
      valor: ordensParadas,
      icon: AlertCircle,
      loading: loadingParadas,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicadores.map((indicador) => {
        const Icon = indicador.icon;
        return (
          <Card key={indicador.titulo} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${indicador.bgColor}`}>
                  <Icon className={`h-5 w-5 ${indicador.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {indicador.titulo}
                  </p>
                  {indicador.loading ? (
                    <div className="h-7 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-0.5">{indicador.valor}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
