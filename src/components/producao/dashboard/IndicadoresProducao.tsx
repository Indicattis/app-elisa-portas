import { Card, CardContent } from "@/components/ui/card";
import { Package, Target, Clock, AlertCircle, DoorOpen } from "lucide-react";
import { usePortasEnrolarProduzidasMes } from "@/hooks/usePortasEnrolarProduzidasMes";
import { useMetaProducaoMes } from "@/hooks/useMetaProducaoMes";
import { usePedidosNaFila } from "@/hooks/usePedidosNaFila";
import { useOrdensParadas } from "@/hooks/useOrdensParadas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function IndicadoresProducao() {
  const { data: portasMes = 0, isLoading: loadingPortas } = usePortasEnrolarProduzidasMes();
  const { data: metaMes = 0, isLoading: loadingMeta } = useMetaProducaoMes();
  const { data: pedidosFila = 0, isLoading: loadingFila } = usePedidosNaFila();
  const { data: ordensParadas = 0, isLoading: loadingParadas } = useOrdensParadas();
  
  const { data: portasHoje = 0, isLoading: loadingPortasHoje } = useQuery({
    queryKey: ["portas-enrolar-hoje"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portas_enrolar_produzidas_hoje");
      if (error) throw error;
      return data || 0;
    },
    refetchInterval: 30000,
  });

  const indicadores = [
    {
      titulo: "Portas Produzidas (Hoje)",
      valor: portasHoje,
      icon: DoorOpen,
      loading: loadingPortasHoje,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {indicadores.map((indicador) => {
        const Icon = indicador.icon;
        return (
          <Card key={indicador.titulo} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${indicador.bgColor}`}>
                  <Icon className={`h-4 w-4 ${indicador.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {indicador.titulo}
                  </p>
                  {indicador.loading ? (
                    <div className="h-6 w-14 bg-muted animate-pulse rounded mt-0.5" />
                  ) : (
                    <p className="text-xl font-bold mt-0.5">{indicador.valor}</p>
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
