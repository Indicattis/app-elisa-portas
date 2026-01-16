import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePortasPorEtapaHoje } from "@/hooks/usePortasPorEtapaHoje";
import { useDesempenhoEtapasHoje, DesempenhoColaboradorHoje } from "@/hooks/useDesempenhoEtapasHoje";
import { Cog, Flame, Package, Paintbrush, Truck } from "lucide-react";

type CampoDesempenho = keyof Pick<DesempenhoColaboradorHoje, 'perfiladas' | 'soldadas' | 'separadas' | 'pintura_m2' | 'carregamentos'>;

interface MiniRankingProps {
  colaboradores: DesempenhoColaboradorHoje[];
  campo: CampoDesempenho;
  unidade?: string;
  isLoading: boolean;
}

function MiniRanking({ colaboradores, campo, unidade = "", isLoading }: MiniRankingProps) {
  if (isLoading) {
    return (
      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  const top3 = colaboradores
    .filter((c) => c[campo] > 0)
    .sort((a, b) => b[campo] - a[campo])
    .slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground italic">Sem produção hoje</p>
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
      {top3.map((c, i) => {
        const valor = campo === 'pintura_m2' 
          ? c[campo].toFixed(1).replace('.', ',')
          : c[campo];
        const iniciais = c.nome
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const primeiroNome = c.nome.split(" ")[0];

        return (
          <div key={c.user_id} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-3 text-muted-foreground font-medium">{i + 1}.</span>
            <Avatar className="h-4 w-4">
              <AvatarImage src={c.foto_perfil_url || undefined} alt={c.nome} />
              <AvatarFallback className="text-[6px]">{iniciais}</AvatarFallback>
            </Avatar>
            <span className="truncate flex-1 text-foreground">{primeiroNome}</span>
            <span className="font-semibold text-foreground">
              {valor}{unidade}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PortasPorEtapa() {
  const { data, isLoading } = usePortasPorEtapaHoje();
  const { data: desempenho = [], isLoading: isLoadingDesempenho } = useDesempenhoEtapasHoje();

  const metragemFormatada = data?.metragem_perfilada 
    ? `${data.metragem_perfilada.toFixed(1).replace('.', ',')}m`
    : "0m";

  const pinturaFormatada = data?.pintura_m2_hoje 
    ? `${data.pintura_m2_hoje.toFixed(1).replace('.', ',')} m²`
    : "0 m²";

  const etapas: {
    label: string;
    value: number | string;
    extra: string | null;
    icon: typeof Cog;
    bgColor: string;
    iconColor: string;
    campoRanking: CampoDesempenho;
    unidadeRanking: string;
  }[] = [
    {
      label: "Perfiladas",
      value: data?.portas_perfiladas ?? 0,
      extra: metragemFormatada,
      icon: Cog,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      campoRanking: "perfiladas",
      unidadeRanking: "",
    },
    {
      label: "Soldadas",
      value: data?.portas_soldadas ?? 0,
      extra: null,
      icon: Flame,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
      campoRanking: "soldadas",
      unidadeRanking: "",
    },
    {
      label: "Separadas",
      value: data?.portas_separadas ?? 0,
      extra: null,
      icon: Package,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      campoRanking: "separadas",
      unidadeRanking: "",
    },
    {
      label: "Pintura",
      value: pinturaFormatada,
      extra: null,
      icon: Paintbrush,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      campoRanking: "pintura_m2",
      unidadeRanking: "m²",
    },
    {
      label: "Carregamentos",
      value: data?.carregamentos_hoje ?? 0,
      extra: null,
      icon: Truck,
      bgColor: "bg-emerald-600/10",
      iconColor: "text-emerald-600",
      campoRanking: "carregamentos",
      unidadeRanking: "",
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Desempenho por Etapa (Hoje)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {etapas.map((etapa) => {
          const Icon = etapa.icon;
          return (
            <div
              key={etapa.label}
              className="flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${etapa.bgColor}`}>
                  <Icon className={`h-5 w-5 ${etapa.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{etapa.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12 mt-1" />
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
              <MiniRanking
                colaboradores={desempenho}
                campo={etapa.campoRanking}
                unidade={etapa.unidadeRanking}
                isLoading={isLoadingDesempenho}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
