import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCronometroEtapa } from "@/hooks/useCronometroEtapa";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { LIMITES_ETAPA_SEGUNDOS } from "@/types/pedidoEtapa";

interface CronometroEtapaBadgeProps {
  dataEntrada?: string | null;
  compact?: boolean;
  etapa?: EtapaPedido;
}

export function CronometroEtapaBadge({ dataEntrada, compact = false, etapa }: CronometroEtapaBadgeProps) {
  const limiteSegundos = etapa ? LIMITES_ETAPA_SEGUNDOS[etapa] : undefined;
  const { tempoDecorrido, cor, deveAnimar } = useCronometroEtapa({ dataEntrada, limiteSegundos });

  if (!dataEntrada) return null;

  const corClasses = {
    green: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50",
    yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/50",
    red: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/50"
  };

  const dataFormatada = format(new Date(dataEntrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0.5 font-mono",
            corClasses[cor],
            compact && "px-1 py-0"
          )}
        >
          <Clock className={cn(
            "h-2.5 w-2.5 mr-0.5",
            deveAnimar && "animate-pulse"
          )} />
          {tempoDecorrido}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">Entrou na etapa: {dataFormatada}</p>
      </TooltipContent>
    </Tooltip>
  );
}
