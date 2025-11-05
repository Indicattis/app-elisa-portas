import { useState, useEffect } from 'react';

export function useCronometroOrdem(capturadaEm: string | null | undefined) {
  const [tempoDecorrido, setTempoDecorrido] = useState<string>('00:00:00');

  useEffect(() => {
    if (!capturadaEm) {
      setTempoDecorrido('--:--:--');
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const inicio = new Date(capturadaEm);
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
  }, [capturadaEm]);

  return tempoDecorrido;
}
