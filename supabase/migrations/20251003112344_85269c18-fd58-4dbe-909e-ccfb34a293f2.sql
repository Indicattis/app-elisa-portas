-- Add entrada and valor_a_receber to vendas table
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS valor_entrada numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_a_receber numeric DEFAULT 0;

-- Add valor_a_receber to instalacoes_cadastradas table
ALTER TABLE public.instalacoes_cadastradas
ADD COLUMN IF NOT EXISTS valor_a_receber numeric DEFAULT 0;

-- Update trigger to pass valor_a_receber to installation
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
    valor_a_receber
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
    NEW.valor_a_receber
  );
  
  RETURN NEW;
END;
$function$;