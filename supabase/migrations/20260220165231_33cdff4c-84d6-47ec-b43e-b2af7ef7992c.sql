
-- 1. Migrar pedido_linhas
UPDATE pedido_linhas SET estoque_id = '0ea33d2c-054a-4205-96f2-0a18e658ef5e' WHERE estoque_id = '74e9ada9-5e1f-43fc-bb41-ac555a75642f';
UPDATE pedido_linhas SET estoque_id = '9cacd94a-0601-4294-bee3-63222cfd5c3b' WHERE estoque_id = 'ce0e7c6d-b1be-45b6-9513-ae39465ec750';

-- 2. Migrar linhas_ordens
UPDATE linhas_ordens SET estoque_id = '0ea33d2c-054a-4205-96f2-0a18e658ef5e' WHERE estoque_id = '74e9ada9-5e1f-43fc-bb41-ac555a75642f';
UPDATE linhas_ordens SET estoque_id = '9cacd94a-0601-4294-bee3-63222cfd5c3b' WHERE estoque_id = 'ce0e7c6d-b1be-45b6-9513-ae39465ec750';

-- 3. Migrar pontuacao_colaboradores
UPDATE pontuacao_colaboradores SET estoque_id = '0ea33d2c-054a-4205-96f2-0a18e658ef5e' WHERE estoque_id = '74e9ada9-5e1f-43fc-bb41-ac555a75642f';
UPDATE pontuacao_colaboradores SET estoque_id = '9cacd94a-0601-4294-bee3-63222cfd5c3b' WHERE estoque_id = 'ce0e7c6d-b1be-45b6-9513-ae39465ec750';

-- 4. Desativar duplicatas
UPDATE estoque SET ativo = false WHERE id IN ('74e9ada9-5e1f-43fc-bb41-ac555a75642f', 'ce0e7c6d-b1be-45b6-9513-ae39465ec750');
