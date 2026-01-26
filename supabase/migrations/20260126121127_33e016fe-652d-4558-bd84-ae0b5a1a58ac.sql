-- Criar ordens de soldagem para pedidos que tem linhas de solda mas não tem ordens
INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'SOL-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'solda'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_soldagem os WHERE os.pedido_id = pl.pedido_id
  );

-- Criar ordens de perfiladeira para pedidos que tem linhas de perfiladeira mas não tem ordens
INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'PERF-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'perfiladeira'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_perfiladeira op WHERE op.pedido_id = pl.pedido_id
  );

-- Criar ordens de separação para pedidos que tem linhas de separação mas não tem ordens
INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'SEP-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'separacao'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_separacao ose WHERE ose.pedido_id = pl.pedido_id
  );