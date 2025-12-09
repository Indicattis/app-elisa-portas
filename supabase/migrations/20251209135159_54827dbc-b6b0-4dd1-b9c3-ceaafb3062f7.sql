
-- Deletar clientes duplicados inativos permanentemente
DELETE FROM clientes 
WHERE ativo = false 
AND id IN (
  'c46a6bff-7c35-4a46-91d2-69e38a5ebd2e',
  '95834884-359f-441f-b1fe-3cc4cbf0d4d0',
  '2cb610d4-58c9-4831-9c52-6d215736ddcc',
  'bb0137a9-9ebb-46b1-a592-3e69997877c1'
);
