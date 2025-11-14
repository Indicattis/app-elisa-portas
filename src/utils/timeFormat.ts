/**
 * Formata segundos em formato de cronômetro HH:MM:SS
 * @param seconds - Número de segundos
 * @returns String formatada no formato HH:MM:SS
 */
export function formatCronometro(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

/**
 * Formata segundos em formato legível (1h 5min)
 * @param seconds - Número de segundos
 * @returns String formatada de forma legível
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${hours}h`;
  }

  return `${minutes}min`;
}

/**
 * Formata segundos para exibição em cronômetro com dias e semanas
 * @param seconds - Número de segundos
 * @returns String formatada com dias/semanas quando aplicável
 */
export function formatCronometroExtended(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const weeks = Math.floor(days / 7);
  
  // Se mais de 7 dias, mostrar semanas
  if (days >= 7) {
    const remainingDays = days % 7;
    if (remainingDays > 0) {
      return `${weeks}sem ${remainingDays}d`;
    }
    return `${weeks}sem`;
  }
  
  // Se mais de 24 horas, mostrar dias
  if (days >= 1) {
    const remainingSeconds = seconds % 86400;
    const hours = Math.floor(remainingSeconds / 3600);
    if (hours > 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d`;
  }
  
  // Menos de 24h, formato normal HH:MM:SS
  return formatCronometro(seconds);
}
