import { useState, useEffect, useMemo } from 'react';
import { formatCronometroExtended } from '@/utils/timeFormat';
import { calcularTempoExpediente, estaNoExpediente } from '@/utils/calcularTempoExpediente';

interface UseCronometroEtapaParams {
  dataEntrada?: string | null;
}

interface CronometroEtapaResult {
  tempoDecorrido: string;
  segundos: number;
  deveAnimar: boolean;
  cor: 'green' | 'yellow' | 'red';
}

// Limite de tempo em segundos (10 dias úteis de trabalho = 10h/dia * 10 dias = 100h = 360000 segundos)
// Mas para simplificar, vamos manter o limite em segundos de expediente
const LIMITE_VERDE = 5 * 10 * 60 * 60; // 5 dias úteis * 10h/dia = 50h = 180000 segundos

export function useCronometroEtapa(params: UseCronometroEtapaParams | string | null | undefined): CronometroEtapaResult {
  const [segundos, setSegundos] = useState<number>(0);

  // Suporte para ambos os formatos: objeto ou string direta
  const dataEntrada = typeof params === 'string' || params === null || params === undefined 
    ? params 
    : params.dataEntrada;

  useEffect(() => {
    if (!dataEntrada) {
      setSegundos(0);
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(dataEntrada as string);

      // Calcular tempo apenas dentro do expediente (7h-17h, seg-sex)
      const segundosExpediente = calcularTempoExpediente(inicio, agora);
      setSegundos(segundosExpediente);
    };

    // Calcular imediatamente
    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [dataEntrada]);

  // Determinar cor baseado no tempo (verde < 10 dias úteis, vermelho >= 10 dias)
  const cor = useMemo((): 'green' | 'yellow' | 'red' => {
    if (segundos < LIMITE_VERDE) return 'green';
    return 'red';
  }, [segundos]);

  // Formatar tempo
  const tempoDecorrido = useMemo(() => {
    if (!dataEntrada) return '--:--:--';
    return formatCronometroExtended(segundos);
  }, [dataEntrada, segundos]);

  // Animação baseada em estar no expediente
  const deveAnimar = useMemo(() => {
    if (!dataEntrada) return false;
    return estaNoExpediente();
  }, [dataEntrada]);

  return {
    tempoDecorrido,
    segundos,
    deveAnimar,
    cor
  };
}
