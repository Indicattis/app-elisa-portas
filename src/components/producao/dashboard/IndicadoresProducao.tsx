import { Card, CardContent } from "@/components/ui/card";
import { Package, Clock, DoorOpen, Calendar } from "lucide-react";
import { usePortasEnrolarProduzidasMes } from "@/hooks/usePortasEnrolarProduzidasMes";
import { usePortasEnrolarProduzidasSemana } from "@/hooks/usePortasEnrolarProduzidasSemana";
import { usePedidosNaFila } from "@/hooks/usePedidosNaFila";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function IndicadoresProducao() {
  const { data: portasMes = 0, isLoading: loadingPortas } = usePortasEnrolarProduzidasMes();
  const { data: portasSemana = 0, isLoading: loadingSemana } = usePortasEnrolarProduzidasSemana();
  const { data: pedidosFila = 0, isLoading: loadingFila } = usePedidosNaFila();
  
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
    },
    {
      titulo: "Portas Produzidas (Semana)",
      valor: portasSemana,
      icon: Calendar,
      loading: loadingSemana,
    },
    {
      titulo: "Portas Produzidas (Mês)",
      valor: portasMes,
      icon: Package,
      loading: loadingPortas,
    },
    {
      titulo: "Pedidos que vão entrar para produção",
      valor: pedidosFila,
      icon: Clock,
      loading: loadingFila,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {indicadores.map((indicador) => {
        const Icon = indicador.icon;
        return (
          <Card key={indicador.titulo} className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background dark:border-blue-800/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/15">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                    {indicador.titulo}
                  </p>
                  {indicador.loading ? (
                    <div className="h-6 w-14 bg-blue-100 dark:bg-blue-900/30 animate-pulse rounded mt-0.5" />
                  ) : (
                    <p className="text-xl font-bold mt-0.5 text-blue-700 dark:text-blue-300">{indicador.valor}</p>
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
