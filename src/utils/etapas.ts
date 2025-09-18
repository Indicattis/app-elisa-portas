export type AutorizadoEtapa = 'apresentacao_proposta' | 'treinamento_ficha_tecnica' | 'treinamento_instalacao' | 'apto';

export const ETAPAS: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'Apresentação Proposta',
  treinamento_ficha_tecnica: 'Treinamento Ficha Técnica',
  treinamento_instalacao: 'Treinamento Instalação',
  apto: 'Apto'
};

export const ETAPA_COLORS: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'hsl(var(--chart-1))',
  treinamento_ficha_tecnica: 'hsl(var(--chart-2))',
  treinamento_instalacao: 'hsl(var(--chart-3))',
  apto: 'hsl(var(--chart-4))'
};

export const ETAPA_ORDER: AutorizadoEtapa[] = [
  'apresentacao_proposta',
  'treinamento_ficha_tecnica',
  'treinamento_instalacao',
  'apto'
];