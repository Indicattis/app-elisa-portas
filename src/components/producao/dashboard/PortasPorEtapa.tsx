import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortasPorEtapaHoje } from "@/hooks/usePortasPorEtapaHoje";
import { Cog, Flame, Package } from "lucide-react";

export function PortasPorEtapa() {
  const { data, isLoading } = usePortasPorEtapaHoje();

  const metragemFormatada = data?.metragem_perfilada 
    ? `${data.metragem_perfilada.toFixed(1).replace('.', ',')}m`
    : "0m";

  const etapas = [
    {
      label: "Perfiladas",
      value: data?.portas_perfiladas ?? 0,
      extra: metragemFormatada,
      icon: Cog,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      label: "Soldadas",
      value: data?.portas_soldadas ?? 0,
      extra: null,
      icon: Flame,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      label: "Separadas",
      value: data?.portas_separadas ?? 0,
      extra: null,
      icon: Package,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Portas por Etapa (Hoje)
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {etapas.map((etapa) => {
          const Icon = etapa.icon;
          return (
            <div
              key={etapa.label}
              className="flex items-center gap-3"
            >
              <div className={`p-2 rounded-md ${etapa.bgColor}`}>
                <Icon className={`h-5 w-5 ${etapa.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{etapa.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold">
                    {etapa.value}
                    {etapa.extra && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ({etapa.extra})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
