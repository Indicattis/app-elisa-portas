-- Remover referência à coluna categoria da função criar_instalacao_automatica
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
  
  -- Criar instalação sem campo categoria (não é mais necessário)
  INSERT INTO public.instalacoes_cadastradas (
    nome_cliente,
    telefone_cliente,
    cidade,
    estado,
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
    COALESCE(tamanhos_portas, 'Não especificado'),
    'pendente_producao',
    'elisa',
    NEW.atendente_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;