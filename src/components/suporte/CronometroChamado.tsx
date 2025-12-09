import { Clock } from "lucide-react";
import { useCronometroChamado, CronometroCor } from "@/hooks/useCronometroChamado";
import { cn } from "@/lib/utils";

interface CronometroChamadoProps {
  createdAt: string;
  updatedAt: string;
  status: string;
}

const corClasses: Record<CronometroCor, string> = {
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
};

export function CronometroChamado({ createdAt, updatedAt, status }: CronometroChamadoProps) {
  const { formatado, cor, ativo } = useCronometroChamado(createdAt, updatedAt, status);

  return (
    <div className={cn("flex items-center gap-1 font-medium text-sm", corClasses[cor])}>
      {ativo && <Clock className="h-3.5 w-3.5 animate-pulse" />}
      <span>{formatado}</span>
    </div>
  );
}
