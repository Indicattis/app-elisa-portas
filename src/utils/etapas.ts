export type AutorizadoEtapa = 'apresentacao_proposta' | 'treinamentos_video' | 'apto' | 'premium';

export const ETAPAS: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'Apresentação Proposta',
  treinamentos_video: 'Treinamentos em Vídeo',
  apto: 'Apto',
  premium: 'Premium'
};

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