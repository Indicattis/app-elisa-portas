export type AutorizadoEtapa = 'apresentacao_proposta' | 'treinamentos_video' | 'apto' | 'premium';
export type RepresentanteEtapa = 'inicial' | 'qualificacao' | 'proposta' | 'contratado';
export type FranqueadoEtapa = 'inicial' | 'avaliacao' | 'aprovacao' | 'ativo';

export const ETAPAS_AUTORIZADO: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'Apresentação Proposta',
  treinamentos_video: 'Treinamentos em Vídeo',
  apto: 'Apto',
  premium: 'Premium'
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
  apresentacao_proposta: 'hsl(var(--chart-1))',
  treinamentos_video: 'hsl(var(--chart-2))',
  apto: 'hsl(var(--chart-4))',
  premium: 'hsl(45, 100%, 51%)' // Golden color
};

export const ETAPA_ORDER: AutorizadoEtapa[] = [
  'apresentacao_proposta',
  'treinamentos_video',
  'apto',
  'premium'
];