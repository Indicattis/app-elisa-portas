ALTER TABLE pedidos_etapas DROP CONSTRAINT pedidos_etapas_etapa_check;

ALTER TABLE pedidos_etapas ADD CONSTRAINT pedidos_etapas_etapa_check
  CHECK (etapa = ANY (ARRAY[
    'aberto', 'aprovacao_ceo', 'em_producao', 'inspecao_qualidade',
    'aguardando_pintura', 'embalagem', 'aguardando_coleta',
    'aguardando_instalacao', 'instalacoes', 'correcoes', 'finalizado'
  ]));