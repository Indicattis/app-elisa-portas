import { useState, useEffect } from 'react';
import { formatCronometroExtended } from '@/utils/timeFormat';

interface UseCronometroOrdemParams {
  capturada_em?: string | null;
  tempo_conclusao_segundos?: number | null;
  todas_linhas_concluidas?: boolean;
  responsavel_id?: string | null;
}

interface CronometroResult {
  tempoDecorrido: string;
  deveAnimar: boolean;
}

export function useCronometroOrdem(params: UseCronometroOrdemParams | string | null | undefined): CronometroResult {
  const [tempoDecorrido, setTempoDecorrido] = useState<string>('00:00:00');
  const [deveAnimar, setDeveAnimar] = useState<boolean>(false);

  // Suporte para ambos os formatos: objeto ou string direta (retrocompatibilidade)
  const capturadaEm = typeof params === 'string' || params === null || params === undefined 
    ? params 
    : params.capturada_em;
  const tempoConclusao = typeof params === 'object' && params !== null 
    ? params.tempo_conclusao_segundos 
    : null;
  const todasLinhasConcluidas = typeof params === 'object' && params !== null 
    ? params.todas_linhas_concluidas 
    : false;
  const responsavelId = typeof params === 'object' && params !== null 
    ? params.responsavel_id 
    : null;

  useEffect(() => {
    // Se tem tempo de conclusão E está concluída, mostrar tempo parado (sem animação)
    if (tempoConclusao !== null && tempoConclusao !== undefined && todasLinhasConcluidas) {
      const formatado = formatCronometroExtended(tempoConclusao);
      setTempoDecorrido(formatado);
      setDeveAnimar(false);
      return; // Não iniciar intervalo, cronômetro parado
    }

    // Se não está capturada ou não tem responsável, não mostrar tempo (sem animação)
    if (!capturadaEm || !responsavelId) {
      setTempoDecorrido('--:--:--');
      setDeveAnimar(false);
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(capturadaEm as string);
      const diff = agora.getTime() - inicio.getTime();

      if (diff < 0) {
        setTempoDecorrido('00:00:00');
        setDeveAnimar(true);
        return;
      }

      const segundos = Math.floor(diff / 1000);
      const formatado = formatCronometroExtended(segundos);
      setTempoDecorrido(formatado);
      setDeveAnimar(true);
    };

    // Calcular imediatamente
    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [capturadaEm, tempoConclusao, todasLinhasConcluidas, responsavelId]);

  return { tempoDecorrido, deveAnimar };
}
