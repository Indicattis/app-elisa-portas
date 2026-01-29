import { useState, useEffect } from 'react';
import { formatCronometroExtended } from '@/utils/timeFormat';
import { calcularTempoExpediente, estaNoExpediente } from '@/utils/calcularTempoExpediente';

interface UseCronometroOrdemParams {
  capturada_em?: string | null;
  tempo_conclusao_segundos?: number | null;
  todas_linhas_concluidas?: boolean;
  responsavel_id?: string | null;
  pausada?: boolean;
  tempo_acumulado_segundos?: number | null;
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
  const pausada = typeof params === 'object' && params !== null 
    ? params.pausada 
    : false;
  const tempoAcumulado = typeof params === 'object' && params !== null 
    ? params.tempo_acumulado_segundos 
    : 0;

  useEffect(() => {
    // Se tem tempo de conclusão E está concluída, mostrar tempo parado (sem animação)
    if (tempoConclusao !== null && tempoConclusao !== undefined && todasLinhasConcluidas) {
      const formatado = formatCronometroExtended(tempoConclusao);
      setTempoDecorrido(formatado);
      setDeveAnimar(false);
      return; // Não iniciar intervalo, cronômetro parado
    }

    // Se está pausada, mostrar tempo acumulado (estático, sem animação)
    if (pausada) {
      const formatado = formatCronometroExtended(tempoAcumulado || 0);
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

      // Calcular tempo apenas dentro do expediente (7h-17h, seg-sex)
      const segundosSessao = calcularTempoExpediente(inicio, agora);
      const segundosTotal = (tempoAcumulado || 0) + segundosSessao;
      
      const formatado = formatCronometroExtended(segundosTotal);
      setTempoDecorrido(formatado);
      
      // Animar apenas se estiver dentro do horário de expediente
      setDeveAnimar(estaNoExpediente());
    };

    // Calcular imediatamente
    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [capturadaEm, tempoConclusao, todasLinhasConcluidas, responsavelId, pausada, tempoAcumulado]);

  return { tempoDecorrido, deveAnimar };
}
