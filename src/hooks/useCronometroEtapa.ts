import { useState, useEffect, useMemo } from 'react';
import { formatCronometroExtended } from '@/utils/timeFormat';

interface UseCronometroEtapaParams {
  dataEntrada?: string | null;
}

interface CronometroEtapaResult {
  tempoDecorrido: string;
  segundos: number;
  deveAnimar: boolean;
  cor: 'green' | 'yellow' | 'red';
}

// Limite de tempo em segundos (10 dias)
const LIMITE_VERDE = 10 * 24 * 60 * 60; // 10 dias

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
      const diff = agora.getTime() - inicio.getTime();

      if (diff < 0) {
        setSegundos(0);
        return;
      }

      setSegundos(Math.floor(diff / 1000));
    };

    // Calcular imediatamente
    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [dataEntrada]);

  // Determinar cor baseado no tempo (verde < 10 dias, vermelho >= 10 dias)
  const cor = useMemo((): 'green' | 'yellow' | 'red' => {
    if (segundos < LIMITE_VERDE) return 'green';
    return 'red';
  }, [segundos]);

  // Formatar tempo
  const tempoDecorrido = useMemo(() => {
    if (!dataEntrada) return '--:--:--';
    return formatCronometroExtended(segundos);
  }, [dataEntrada, segundos]);

  return {
    tempoDecorrido,
    segundos,
    deveAnimar: !!dataEntrada,
    cor
  };
}
