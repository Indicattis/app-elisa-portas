/**
 * Utilitários para cálculo de períodos de metas (semanal/mensal).
 * Datas são manipuladas em horário local; strings retornadas usam o sufixo
 * T12:00:00.000Z (regra do projeto) para evitar deslocamento de fuso.
 */

function toIsoMidday(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T12:00:00.000Z`;
}

export function getInicioFimSemana(ref: Date = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  // Segunda = 1; getDay() Domingo=0
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const inicio = new Date(d);
  inicio.setDate(d.getDate() + diffToMonday);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  return {
    inicio,
    fim,
    inicioIso: toIsoMidday(inicio),
    fimIso: toIsoMidday(fim),
  };
}

export function getInicioFimMes(ref: Date = new Date()) {
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return {
    inicio,
    fim,
    inicioIso: toIsoMidday(inicio),
    fimIso: toIsoMidday(fim),
  };
}

export function formatarPeriodo(periodo: 'semanal' | 'mensal', ref: Date = new Date()): string {
  if (periodo === 'semanal') {
    const { inicio, fim } = getInicioFimSemana(ref);
    const f = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `Semana de ${f(inicio)} a ${f(fim)}`;
  }
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${meses[ref.getMonth()]} ${ref.getFullYear()}`;
}