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
