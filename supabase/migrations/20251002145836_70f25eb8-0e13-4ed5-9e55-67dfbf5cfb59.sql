-- Remover trigger e função que causavam erros de foreign key
DROP TRIGGER IF EXISTS trigger_inserir_contador_vendas ON public.vendas;
DROP FUNCTION IF EXISTS public.inserir_contador_vendas_automatico();

-- Criar índices para otimizar agregações na tabela vendas
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_atendente_data ON public.vendas(atendente_id, data_venda);

-- Comentar a tabela contador_vendas_dias para indicar que não é mais usada
COMMENT ON TABLE public.contador_vendas_dias IS 'DEPRECATED: Esta tabela não é mais usada. Os dados agora vêm diretamente da tabela vendas.';