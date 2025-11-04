export type AutorizadoEtapa = 'ativo' | 'premium' | 'perdido';
export type RepresentanteEtapa = 'inicial' | 'qualificacao' | 'proposta' | 'contratado';
export type FranqueadoEtapa = 'inicial' | 'avaliacao' | 'aprovacao' | 'ativo';

export const ETAPAS_AUTORIZADO: Record<AutorizadoEtapa, string> = {
  ativo: 'Ativo',
  premium: 'Premium',
  perdido: 'Perdido'
};

export const ETAPAS_REPRESENTANTE: Record<RepresentanteEtapa, string> = {
  inicial: 'Inicial',
  qualificacao: 'Qualificação',
  proposta: 'Proposta',
  contratado: 'Contratado'
};

export const ETAPAS_FRANQUEADO: Record<FranqueadoEtapa, string> = {
  inicial: 'Inicial',
  avaliacao: 'Avaliação',
  aprovacao: 'Aprovação',
  ativo: 'Ativo'
};

// Mantendo compatibilidade com código existente
export const ETAPAS = ETAPAS_AUTORIZADO;

export const ETAPA_COLORS: Record<AutorizadoEtapa, string> = {
  ativo: 'hsl(var(--chart-4))', // Verde
  premium: 'hsl(45, 100%, 51%)', // Dourado
  perdido: 'hsl(var(--chart-3))' // Vermelho
};

export const ETAPA_ORDER: AutorizadoEtapa[] = [
  'ativo',
  'premium',
  'perdido'
];