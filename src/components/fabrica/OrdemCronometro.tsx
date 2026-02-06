import { Timer } from "lucide-react";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { cn } from "@/lib/utils";

const LIMITE_QUALIDADE = 2 * 60 * 60; // 7200 segundos

interface OrdemCronometroProps {
  ordem: {
    capturada_em: string | null;
    tempo_acumulado_segundos: number | null;
    tempo_conclusao_segundos: number | null;
    pausada: boolean;
    responsavel_id: string | null;
    status: string | null;
    linhas_concluidas: number;
    total_linhas: number;
  };
  tipoOrdem?: string;
}

export function OrdemCronometro({ ordem, tipoOrdem }: OrdemCronometroProps) {
  const todasConcluidas = ordem.total_linhas > 0 
    ? ordem.linhas_concluidas >= ordem.total_linhas 
    : ordem.status === 'concluido';

  const { tempoDecorrido, deveAnimar, segundosTotais } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_acumulado_segundos: ordem.tempo_acumulado_segundos,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    pausada: ordem.pausada,
    responsavel_id: ordem.responsavel_id,
    todas_linhas_concluidas: todasConcluidas,
  });

  const isVermelho = tipoOrdem === 'qualidade' && segundosTotais >= LIMITE_QUALIDADE;

  // Não mostrar se não tem tempo
  if (tempoDecorrido === '--:--:--') return null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-[10px] opacity-80",
      deveAnimar && "animate-pulse",
      isVermelho && "text-red-500 opacity-100"
    )}>
      <Timer className="w-3 h-3" />
      <span className="font-mono">{tempoDecorrido}</span>
    </div>
  );
}
