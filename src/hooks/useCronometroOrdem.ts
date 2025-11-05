import { useState, useEffect } from 'react';

interface UseCronometroOrdemParams {
  capturada_em?: string | null;
  tempo_conclusao_segundos?: number | null;
  todas_linhas_concluidas?: boolean;
}

export function useCronometroOrdem(params: UseCronometroOrdemParams | string | null | undefined) {
  const [tempoDecorrido, setTempoDecorrido] = useState<string>('00:00:00');

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

  useEffect(() => {
    // Se tem tempo de conclusão armazenado, mostrar esse tempo (parado)
    if (tempoConclusao !== null && tempoConclusao !== undefined) {
      const horas = Math.floor(tempoConclusao / 3600);
      const minutos = Math.floor((tempoConclusao % 3600) / 60);
      const segundos = tempoConclusao % 60;
      const formatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      setTempoDecorrido(formatado);
      return; // Não iniciar intervalo, cronômetro parado
    }

    // Se todas as linhas estão concluídas mas não tem tempo armazenado, não mostrar
    if (todasLinhasConcluidas) {
      setTempoDecorrido('--:--:--');
      return;
    }

    if (!capturadaEm) {
      setTempoDecorrido('--:--:--');
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(capturadaEm as string);
      const diff = agora.getTime() - inicio.getTime();

      if (diff < 0) {
        setTempoDecorrido('00:00:00');
        return;
      }

      const segundos = Math.floor(diff / 1000);
      const minutos = Math.floor(segundos / 60);
      const horas = Math.floor(minutos / 60);

      const s = segundos % 60;
      const m = minutos % 60;
      const h = horas;

      const formatado = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      setTempoDecorrido(formatado);
    };

    // Calcular imediatamente
    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [capturadaEm, tempoConclusao, todasLinhasConcluidas]);

  return tempoDecorrido;
}
