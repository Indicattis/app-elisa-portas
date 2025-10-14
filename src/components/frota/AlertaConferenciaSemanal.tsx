import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AlertaConferenciaProps {
  precisaConferencia: boolean;
}

export function AlertaConferenciaSemanal({ precisaConferencia }: AlertaConferenciaProps) {
  if (!precisaConferencia) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Sem conferência
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Este veículo não foi conferido esta semana</p>
      </TooltipContent>
    </Tooltip>
  );
}
