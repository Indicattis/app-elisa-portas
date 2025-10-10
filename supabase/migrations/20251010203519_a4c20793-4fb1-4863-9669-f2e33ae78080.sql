-- Adicionar coluna pagamento_na_entrega na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS pagamento_na_entrega boolean DEFAULT false;

-- Remover colunas redundantes de instalacoes_cadastradas
ALTER TABLE public.instalacoes_cadastradas 
DROP COLUMN IF EXISTS saldo;

ALTER TABLE public.instalacoes_cadastradas 
DROP COLUMN IF EXISTS valor_a_receber;

-- Atualizar função trigger criar_instalacao_automatica
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
  
  -- Criar instalação sem campos financeiros (serão buscados da venda via venda_id)
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
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;