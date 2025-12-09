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

// Limites de tempo em segundos
const LIMITE_VERDE = 4 * 60 * 60; // 4 horas
const LIMITE_AMARELO = 24 * 60 * 60; // 24 horas

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

  // Determinar cor baseado no tempo
  const cor = useMemo((): 'green' | 'yellow' | 'red' => {
    if (segundos < LIMITE_VERDE) return 'green';
    if (segundos < LIMITE_AMARELO) return 'yellow';
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
