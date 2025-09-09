export type AutorizadoEtapa = 'integracao' | 'treinamento_comercial' | 'treinamento_ficha_tecnica' | 'treinamento_instalacao' | 'apto';

export const ETAPAS: Record<AutorizadoEtapa, string> = {
  integracao: 'Integração',
  treinamento_comercial: 'Treinamento Comercial',
  treinamento_ficha_tecnica: 'Treinamento Ficha Técnica',
  treinamento_instalacao: 'Treinamento Instalação',
  apto: 'Apto'
};

export const ETAPA_COLORS: Record<AutorizadoEtapa, string> = {
  integracao: 'hsl(var(--chart-1))',
  treinamento_comercial: 'hsl(var(--chart-2))', 
  treinamento_ficha_tecnica: 'hsl(var(--chart-3))',
  treinamento_instalacao: 'hsl(var(--chart-4))',
  apto: 'hsl(var(--chart-5))'
};

export const ETAPA_ORDER: AutorizadoEtapa[] = [
  'integracao',
  'treinamento_comercial', 
  'treinamento_ficha_tecnica',
  'treinamento_instalacao',
  'apto'
];