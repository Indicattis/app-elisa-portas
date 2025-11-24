export interface InstalacaoCronograma {
  id: string;
  nome_cliente: string;
  data_instalacao: string;
  hora: string | null;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  tipo_instalacao: string | null;
  status: string;
  venda?: {
    id: string;
    cliente_nome: string;
    cidade: string | null;
    estado: string | null;
  };
  pedido?: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
  };
}
