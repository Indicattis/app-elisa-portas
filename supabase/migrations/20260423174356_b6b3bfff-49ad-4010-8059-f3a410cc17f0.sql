ALTER TABLE public.pedidos_producao DROP CONSTRAINT IF EXISTS pedidos_producao_etapa_atual_check;

ALTER TABLE public.pedidos_producao ADD CONSTRAINT pedidos_producao_etapa_atual_check
CHECK (etapa_atual = ANY (ARRAY[
  'aprovacao_diretor'::text,
  'aberto'::text,
  'aprovacao_ceo'::text,
  'em_producao'::text,
  'inspecao_qualidade'::text,
  'aguardando_pintura'::text,
  'embalagem'::text,
  'aguardando_coleta'::text,
  'aguardando_instalacao'::text,
  'instalacoes'::text,
  'correcoes'::text,
  'aguardando_cliente'::text,
  'finalizado'::text
]));