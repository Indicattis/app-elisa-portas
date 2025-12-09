
-- Limpar duplicatas existentes mantendo o cliente com mais vendas
-- Para CPF 012.097.050-36: manter a0ca6229 (tem vendas), desativar os outros
-- Para CNPJ 61.056.044/0001-28: manter f43488c3 (tem 2 vendas), desativar os outros

-- Desativar duplicatas do CPF 012.097.050-36
UPDATE clientes 
SET ativo = false, updated_at = now()
WHERE id IN ('c46a6bff-7c35-4a46-91d2-69e38a5ebd2e', '95834884-359f-441f-b1fe-3cc4cbf0d4d0');

-- Reatribuir vendas dos duplicados para o principal
UPDATE vendas 
SET cliente_id = 'a0ca6229-1706-47c7-833c-36658e84e4cf'
WHERE cliente_id IN ('c46a6bff-7c35-4a46-91d2-69e38a5ebd2e', '95834884-359f-441f-b1fe-3cc4cbf0d4d0');

-- Desativar duplicatas do CNPJ 61.056.044/0001-28
UPDATE clientes 
SET ativo = false, updated_at = now()
WHERE id IN ('2cb610d4-58c9-4831-9c52-6d215736ddcc', 'bb0137a9-9ebb-46b1-a592-3e69997877c1');

-- Reatribuir vendas dos duplicados para o principal
UPDATE vendas 
SET cliente_id = 'f43488c3-e88f-4573-bd04-27ecadda2718'
WHERE cliente_id IN ('2cb610d4-58c9-4831-9c52-6d215736ddcc', 'bb0137a9-9ebb-46b1-a592-3e69997877c1');

-- Criar índice UNIQUE parcial para impedir duplicatas futuras
-- Apenas para clientes ativos com CPF/CNPJ preenchido
CREATE UNIQUE INDEX IF NOT EXISTS unique_cpf_cnpj_ativo 
ON clientes (cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL 
  AND cpf_cnpj != '' 
  AND ativo = true;
