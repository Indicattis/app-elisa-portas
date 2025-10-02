-- Atualizar função para criar instalação sempre que uma venda for criada
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
    created_by
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
    NEW.atendente_id
  );
  
  RETURN NEW;
END;
$function$;