import { useState, useEffect, useMemo } from 'react';
import { formatCronometroExtended } from '@/utils/timeFormat';
import { calcularTempoExpediente, estaNoExpediente } from '@/utils/calcularTempoExpediente';

interface UseCronometroEtapaParams {
  dataEntrada?: string | null;
  limiteSegundos?: number;
}

interface CronometroEtapaResult {
  tempoDecorrido: string;
  segundos: number;
  deveAnimar: boolean;
  cor: 'green' | 'yellow' | 'red';
}

// Default: 5 dias úteis (retrocompatibilidade)
const LIMITE_DEFAULT = 5 * 10 * 60 * 60;

export function useCronometroEtapa(params: UseCronometroEtapaParams | string | null | undefined): CronometroEtapaResult {
  const [segundos, setSegundos] = useState<number>(0);

  // Suporte para ambos os formatos: objeto ou string direta
  const dataEntrada = typeof params === 'string' || params === null || params === undefined 
    ? params 
    : params.dataEntrada;

  const limite = (typeof params === 'object' && params !== null && 'limiteSegundos' in params && params.limiteSegundos)
    ? params.limiteSegundos
    : LIMITE_DEFAULT;

  useEffect(() => {
    if (!dataEntrada) {
      setSegundos(0);
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(dataEntrada as string);
      const segundosExpediente = calcularTempoExpediente(inicio, agora);
      setSegundos(segundosExpediente);
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }, [dataEntrada]);

  const cor = useMemo((): 'green' | 'yellow' | 'red' => {
    if (segundos < limite) return 'green';
    return 'red';
  }, [segundos, limite]);

  const tempoDecorrido = useMemo(() => {
    if (!dataEntrada) return '--:--:--';
    return formatCronometroExtended(segundos);
  }, [dataEntrada, segundos]);

  const deveAnimar = useMemo(() => {
    if (!dataEntrada) return false;
    return estaNoExpediente();
  }, [dataEntrada]);

  return { tempoDecorrido, segundos, deveAnimar, cor };
}
