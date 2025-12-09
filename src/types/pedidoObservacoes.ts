export const OPCOES_TUBO = {
  sem_tubo: 'Sem tubo',
  tubo_afastamento: 'Tubo de afastamento',
} as const;

export const OPCOES_INTERNA_EXTERNA = {
  porta_interna: 'Porta interna',
  porta_externa: 'Porta externa',
} as const;

export const OPCOES_RETIRADA_PORTA = {
  true: 'Sim',
  false: 'Não',
} as const;

export const OPCOES_POSICAO_GUIA = {
  guia_dentro_vao: 'Guia dentro do vão',
  guia_fora_vao: 'Guia fora do vão',
} as const;

export const OPCOES_GUIA = {
  guia_aparente: 'Guia aparente',
  misto: 'Misto',
  escondido: 'Escondido',
} as const;

export const OPCOES_ROLO = {
  nao_erguer: 'Não erguer a porta no rolo',
  erguer: 'Erguer a porta no rolo',
} as const;

export const OPCOES_TUBO_TIRAS_FRONTAIS = {
  com_tubo_tiras_frontais: 'Tubo para tiras frontais',
  sem_tubo_tiras_frontais: 'Sem tubo para tiras frontais',
} as const;

export const OPCOES_LADO_MOTOR = {
  esquerdo: 'Esquerdo',
  direito: 'Direito',
} as const;

export interface PedidoPortaObservacoes {
  id: string;
  pedido_id: string;
  produto_venda_id: string;
  responsavel_medidas_id: string | null;
  opcao_tubo: keyof typeof OPCOES_TUBO;
  interna_externa: keyof typeof OPCOES_INTERNA_EXTERNA;
  retirada_porta: boolean;
  posicao_guia: keyof typeof OPCOES_POSICAO_GUIA;
  opcao_guia: keyof typeof OPCOES_GUIA;
  opcao_rolo: keyof typeof OPCOES_ROLO;
  tubo_tiras_frontais: keyof typeof OPCOES_TUBO_TIRAS_FRONTAIS;
  lado_motor: keyof typeof OPCOES_LADO_MOTOR;
  created_at: string;
  updated_at: string;
}

export type PedidoPortaObservacoesInsert = Omit<PedidoPortaObservacoes, 'id' | 'created_at' | 'updated_at'>;
export type PedidoPortaObservacoesUpdate = Partial<PedidoPortaObservacoesInsert>;
