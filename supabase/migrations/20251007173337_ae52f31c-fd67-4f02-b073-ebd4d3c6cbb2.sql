-- Remover constraint antiga que não aceita os novos tipos de produto
ALTER TABLE public.portas_vendas
DROP CONSTRAINT IF EXISTS check_tipo_produto;

-- Criar nova constraint com tipos atualizados
ALTER TABLE public.portas_vendas
ADD CONSTRAINT check_tipo_produto 
CHECK (tipo_produto IN (
  'porta_enrolar', 
  'porta_social', 
  'pintura_epoxi', 
  'acessorio', 
  'adicional',
  'porta'  -- Mantido para retrocompatibilidade com vendas antigas
));

-- Adicionar comentário explicativo
COMMENT ON CONSTRAINT check_tipo_produto ON public.portas_vendas IS 
'Tipos válidos: porta_enrolar, porta_social, pintura_epoxi, acessorio, adicional. O valor "porta" é mantido para compatibilidade com registros antigos.';