export type TipoParceiro = 'autorizado' | 'representante' | 'licenciado';
export type RepresentanteEtapa = 'inicial' | 'qualificacao' | 'proposta' | 'contratado';
export type LicenciadoEtapa = 'inicial' | 'avaliacao' | 'aprovacao' | 'ativo';
export type AutorizadoEtapa = 'apresentacao_proposta' | 'treinamento_ficha_tecnica' | 'treinamento_instalacao' | 'apto';

// Etapas para Autorizados
export const ETAPAS_AUTORIZADO: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'Apresentação Proposta',
  treinamento_ficha_tecnica: 'Treinamento Ficha Técnica',
  treinamento_instalacao: 'Treinamento Instalação',
  apto: 'Apto'
};

// Etapas para Representantes
export const ETAPAS_REPRESENTANTE: Record<RepresentanteEtapa, string> = {
  inicial: 'Contato Inicial',
  qualificacao: 'Em Qualificação',
  proposta: 'Proposta Enviada',
  contratado: 'Contratado'
};

// Etapas para Licenciados
export const ETAPAS_LICENCIADO: Record<LicenciadoEtapa, string> = {
  inicial: 'Documentação Inicial',
  avaliacao: 'Em Avaliação',
  aprovacao: 'Aguardando Aprovação',
  ativo: 'Licença Ativa'
};

// Cores das etapas
export const ETAPA_COLORS_AUTORIZADO: Record<AutorizadoEtapa, string> = {
  apresentacao_proposta: 'hsl(var(--chart-1))',
  treinamento_ficha_tecnica: 'hsl(var(--chart-2))',
  treinamento_instalacao: 'hsl(var(--chart-3))',
  apto: 'hsl(var(--chart-4))'
};

export const ETAPA_COLORS_REPRESENTANTE: Record<RepresentanteEtapa, string> = {
  inicial: 'hsl(var(--chart-5))',
  qualificacao: 'hsl(var(--chart-1))',
  proposta: 'hsl(var(--chart-2))',
  contratado: 'hsl(var(--chart-4))'
};

export const ETAPA_COLORS_LICENCIADO: Record<LicenciadoEtapa, string> = {
  inicial: 'hsl(var(--chart-3))',
  avaliacao: 'hsl(var(--chart-1))',
  aprovacao: 'hsl(var(--chart-2))',
  ativo: 'hsl(220, 70%, 50%)'
};

// Ordenação das etapas
export const ETAPA_ORDER_AUTORIZADO: AutorizadoEtapa[] = [
  'apresentacao_proposta',
  'treinamento_ficha_tecnica',
  'treinamento_instalacao',
  'apto'
];

export const ETAPA_ORDER_REPRESENTANTE: RepresentanteEtapa[] = [
  'inicial',
  'qualificacao',
  'proposta',
  'contratado'
];

export const ETAPA_ORDER_LICENCIADO: LicenciadoEtapa[] = [
  'inicial',
  'avaliacao',
  'aprovacao',
  'ativo'
];

// Tipos de labels para os parceiros
export const TIPO_PARCEIRO_LABELS: Record<TipoParceiro, string> = {
  autorizado: 'Autorizado',
  representante: 'Representante',
  licenciado: 'Licenciado'
};

// Categorias de avaliação por tipo de parceiro
export const RATING_CATEGORIES = {
  autorizado: [
    { value: 'instalacao', label: 'Instalação' },
    { value: 'bos', label: 'BOS' },
    { value: 'visita_tecnica', label: 'Visita Técnica' },
    { value: 'manutencao', label: 'Manutenção' }
  ],
  representante: [
    { value: 'representante_vendas', label: 'Vendas' },
    { value: 'representante_suporte', label: 'Suporte' }
  ],
  licenciado: [
    { value: 'licenciado_compliance', label: 'Compliance' },
    { value: 'licenciado_vendas', label: 'Vendas' }
  ]
};

// Função para obter etapas baseado no tipo
export function getEtapasByTipo(tipo: TipoParceiro) {
  switch (tipo) {
    case 'autorizado':
      return { etapas: ETAPAS_AUTORIZADO, order: ETAPA_ORDER_AUTORIZADO, colors: ETAPA_COLORS_AUTORIZADO };
    case 'representante':
      return { etapas: ETAPAS_REPRESENTANTE, order: ETAPA_ORDER_REPRESENTANTE, colors: ETAPA_COLORS_REPRESENTANTE };
    case 'licenciado':
      return { etapas: ETAPAS_LICENCIADO, order: ETAPA_ORDER_LICENCIADO, colors: ETAPA_COLORS_LICENCIADO };
    default:
      return { etapas: ETAPAS_AUTORIZADO, order: ETAPA_ORDER_AUTORIZADO, colors: ETAPA_COLORS_AUTORIZADO };
  }
}

// Função para obter etapa atual do parceiro
export function getCurrentEtapa(parceiro: any): string | null {
  switch (parceiro.tipo_parceiro) {
    case 'autorizado':
      return parceiro.etapa || null;
    case 'representante':
      return parceiro.representante_etapa || null;
    case 'licenciado':
      return parceiro.licenciado_etapa || null;
    default:
      return null;
  }
}

// Função para obter cor do marker no mapa baseado no tipo
export function getMarkerColorByTipo(tipo: TipoParceiro): string {
  switch (tipo) {
    case 'autorizado':
      return '#3B82F6'; // Azul
    case 'representante':
      return '#6B7280'; // Cinza
    case 'licenciado':
      return '#EAB308'; // Dourado
    default:
      return '#3B82F6';
  }
}