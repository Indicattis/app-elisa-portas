import { useState, useEffect, useMemo } from "react";

// Limites em segundos
const LIMITE_VERDE = 3 * 24 * 60 * 60; // 3 dias
const LIMITE_VERMELHO = 7 * 24 * 60 * 60; // 7 dias

export type CronometroCor = "green" | "yellow" | "red";

export interface CronometroChamadoResult {
  segundos: number;
  formatado: string;
  cor: CronometroCor;
  ativo: boolean;
}

function formatarTempo(segundos: number): string {
  const dias = Math.floor(segundos / (24 * 60 * 60));
  const horas = Math.floor((segundos % (24 * 60 * 60)) / (60 * 60));
  const minutos = Math.floor((segundos % (60 * 60)) / 60);

  if (dias > 0) {
    if (dias >= 7) {
      const semanas = Math.floor(dias / 7);
      const diasRestantes = dias % 7;
      if (diasRestantes > 0) {
        return `${semanas}sem ${diasRestantes}d`;
      }
      return `${semanas}sem`;
    }
    return `${dias}d ${horas}h`;
  }
  
  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  
  return `${minutos}m`;
}

function obterCor(segundos: number): CronometroCor {
  if (segundos < LIMITE_VERDE) return "green";
  if (segundos < LIMITE_VERMELHO) return "yellow";
  return "red";
}

export function useCronometroChamado(
  createdAt: string,
  updatedAt: string,
  status: string
): CronometroChamadoResult {
  const isPendente = status === "pendente";
  
  // Para chamados finalizados, calcula tempo entre created_at e updated_at
  const tempoFinal = useMemo(() => {
    if (isPendente) return 0;
    const inicio = new Date(createdAt).getTime();
    const fim = new Date(updatedAt).getTime();
    return Math.floor((fim - inicio) / 1000);
  }, [createdAt, updatedAt, isPendente]);

  const [segundosAtivos, setSegundosAtivos] = useState(() => {
    if (!isPendente) return tempoFinal;
    const inicio = new Date(createdAt).getTime();
    return Math.floor((Date.now() - inicio) / 1000);
  });

  useEffect(() => {
    if (!isPendente) {
      setSegundosAtivos(tempoFinal);
      return;
    }

    const calcularSegundos = () => {
      const inicio = new Date(createdAt).getTime();
      return Math.floor((Date.now() - inicio) / 1000);
    };

    setSegundosAtivos(calcularSegundos());

    const interval = setInterval(() => {
      setSegundosAtivos(calcularSegundos());
    }, 60000); // Atualiza a cada minuto para performance

    return () => clearInterval(interval);
  }, [createdAt, isPendente, tempoFinal]);

  return {
    segundos: segundosAtivos,
    formatado: formatarTempo(segundosAtivos),
    cor: obterCor(segundosAtivos),
    ativo: isPendente,
  };
}
