ALTER TABLE pedidos_producao DROP CONSTRAINT pedidos_producao_etapa_atual_check;
ALTER TABLE pedidos_producao ADD CONSTRAINT pedidos_producao_etapa_atual_check 
  CHECK (etapa_atual = ANY (ARRAY[
    'aprovacao_diretor','aberto','aprovacao_ceo','em_producao',
    'inspecao_qualidade','aguardando_pintura','embalagem',
    'aguardando_coleta','aguardando_instalacao','instalacoes',
    'correcoes','finalizado'
  ]));