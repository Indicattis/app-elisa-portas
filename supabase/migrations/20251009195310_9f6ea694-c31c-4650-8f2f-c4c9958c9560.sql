-- ETAPA 1: Adicionar coluna venda_id com foreign key e ON DELETE CASCADE
ALTER TABLE public.instalacoes_cadastradas 
ADD COLUMN venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE;

-- ETAPA 2: Atualizar instalações existentes com venda_id correto
-- Associar instalações às vendas usando matching por nome + telefone
UPDATE public.instalacoes_cadastradas ic
SET venda_id = v.id
FROM public.vendas v
WHERE ic.nome_cliente = v.cliente_nome 
  AND ic.telefone_cliente = v.cliente_telefone
  AND ic.venda_id IS NULL;

-- ETAPA 3: Limpar instalações órfãs antigas (> 30 dias sem venda)
DELETE FROM public.instalacoes_cadastradas 
WHERE venda_id IS NULL 
  AND created_at < NOW() - INTERVAL '30 days';

-- ETAPA 4: Atualizar trigger para incluir venda_id
CREATE OR REPLACE FUNCTION public.criar_instalacao_automatica()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  tamanhos_portas text;
  quantidade_portas integer;
BEGIN
  -- Contar quantidade de portas (sempre será 1 para vendas avulsas)
  quantidade_portas := 1;
  
  -- Concatenar informação de instalação
  tamanhos_portas := 'Venda avulsa';
  
  -- Criar instalação para TODA venda criada
  INSERT INTO public.instalacoes_cadastradas (
    nome_cliente,
    telefone_cliente,
    cidade,
    estado,
    categoria,
    tamanho,
    status,
    tipo_instalacao,
    created_by,
    valor_a_receber,
    venda_id
  )
  VALUES (
    NEW.cliente_nome,
    NEW.cliente_telefone,
    NEW.cidade,
    NEW.estado,
    'instalacao',
    COALESCE(tamanhos_portas, 'Não especificado'),
    'pendente_producao',
    'elisa',
    NEW.atendente_id,
    NEW.valor_a_receber,
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

-- ETAPA 5: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_instalacoes_venda_id 
ON public.instalacoes_cadastradas(venda_id);