-- 1) Backup de segurança
CREATE TABLE IF NOT EXISTS public.produtos_vendas_backup_pre_split_instalacao AS
SELECT * FROM public.produtos_vendas
WHERE valor_instalacao > 0 AND tipo_produto != 'instalacao';

-- 2) Inserir produtos de instalação separados, calculando lucro como 40% do valor líquido
WITH legacy AS (
  SELECT 
    pv.*,
    COALESCE(pv.quantidade, 1) AS qtd,
    -- subtotal bruto da linha (sem desconto)
    (COALESCE(pv.valor_produto,0) + COALESCE(pv.valor_pintura,0) + COALESCE(pv.valor_instalacao,0)) AS subtotal_bruto_unit,
    -- desconto aplicado no produto
    CASE 
      WHEN pv.tipo_desconto = 'valor' THEN COALESCE(pv.desconto_valor,0)
      ELSE (COALESCE(pv.valor_produto,0) + COALESCE(pv.valor_pintura,0) + COALESCE(pv.valor_instalacao,0)) * COALESCE(pv.desconto_percentual,0) / 100
    END AS desconto_unit
  FROM public.produtos_vendas pv
  WHERE pv.valor_instalacao > 0 AND pv.tipo_produto != 'instalacao'
),
calc AS (
  SELECT 
    l.*,
    -- proporção do valor de instalação no subtotal bruto
    CASE WHEN l.subtotal_bruto_unit > 0 
      THEN l.valor_instalacao / l.subtotal_bruto_unit 
      ELSE 0 
    END AS proporcao_inst,
    -- valor líquido da instalação (após desconto proporcional) por unidade
    CASE WHEN l.subtotal_bruto_unit > 0 
      THEN l.valor_instalacao - (l.desconto_unit * l.valor_instalacao / l.subtotal_bruto_unit)
      ELSE l.valor_instalacao
    END AS valor_inst_liquido_unit
  FROM legacy l
)
INSERT INTO public.produtos_vendas (
  venda_id, tamanho, tipo_produto, descricao, 
  valor_produto, valor_pintura, valor_instalacao, valor_frete,
  valor_total, valor_total_sem_frete,
  quantidade, lucro_item, custo_producao, faturamento,
  tipo_desconto, desconto_percentual, desconto_valor,
  tipo_fabricacao
)
SELECT 
  c.venda_id,
  'Instalação' AS tamanho,
  'instalacao' AS tipo_produto,
  'Instalação' AS descricao,
  c.valor_instalacao AS valor_produto,  -- registra o valor como valor_produto da nova linha
  0 AS valor_pintura,
  0 AS valor_instalacao,
  0 AS valor_frete,
  c.valor_instalacao * c.qtd AS valor_total,
  c.valor_instalacao * c.qtd AS valor_total_sem_frete,
  c.qtd AS quantidade,
  -- lucro = 40% do valor líquido total (após desconto, x quantidade)
  ROUND((c.valor_inst_liquido_unit * c.qtd * 0.40)::numeric, 2) AS lucro_item,
  ROUND((c.valor_inst_liquido_unit * c.qtd * 0.60)::numeric, 2) AS custo_producao,
  c.faturamento,
  'percentual' AS tipo_desconto,
  0 AS desconto_percentual,
  0 AS desconto_valor,
  COALESCE(c.tipo_fabricacao, 'interno') AS tipo_fabricacao
FROM calc c;

-- 3) Atualizar produtos legados: subtrair lucro de instalação e zerar valor_instalacao
WITH legacy AS (
  SELECT 
    pv.id,
    COALESCE(pv.quantidade, 1) AS qtd,
    (COALESCE(pv.valor_produto,0) + COALESCE(pv.valor_pintura,0) + COALESCE(pv.valor_instalacao,0)) AS subtotal_bruto_unit,
    pv.valor_instalacao,
    pv.valor_pintura,
    pv.valor_produto,
    pv.valor_frete,
    pv.lucro_item,
    pv.custo_producao,
    CASE 
      WHEN pv.tipo_desconto = 'valor' THEN COALESCE(pv.desconto_valor,0)
      ELSE (COALESCE(pv.valor_produto,0) + COALESCE(pv.valor_pintura,0) + COALESCE(pv.valor_instalacao,0)) * COALESCE(pv.desconto_percentual,0) / 100
    END AS desconto_unit
  FROM public.produtos_vendas pv
  WHERE pv.valor_instalacao > 0 AND pv.tipo_produto != 'instalacao'
),
calc AS (
  SELECT 
    l.*,
    CASE WHEN l.subtotal_bruto_unit > 0 
      THEN l.valor_instalacao - (l.desconto_unit * l.valor_instalacao / l.subtotal_bruto_unit)
      ELSE l.valor_instalacao
    END AS valor_inst_liquido_unit
  FROM legacy l
),
ajuste AS (
  SELECT 
    c.id,
    ROUND((c.valor_inst_liquido_unit * c.qtd * 0.40)::numeric, 2) AS lucro_extraido,
    ROUND((c.valor_inst_liquido_unit * c.qtd * 0.60)::numeric, 2) AS custo_extraido,
    -- novo subtotal bruto da linha (sem instalação)
    (c.valor_produto + c.valor_pintura) AS novo_subtotal_bruto_unit,
    -- novo total da linha (sem instalação) - aplicando desconto proporcional
    CASE WHEN c.subtotal_bruto_unit > 0
      THEN ((c.valor_produto + c.valor_pintura) - (c.desconto_unit * (c.valor_produto + c.valor_pintura) / c.subtotal_bruto_unit)) * c.qtd
      ELSE (c.valor_produto + c.valor_pintura) * c.qtd
    END AS novo_valor_total_sem_frete,
    c.valor_frete
  FROM calc c
)
UPDATE public.produtos_vendas pv
SET 
  valor_instalacao = 0,
  lucro_item = GREATEST(0, COALESCE(pv.lucro_item,0) - a.lucro_extraido),
  custo_producao = GREATEST(0, COALESCE(pv.custo_producao,0) - a.custo_extraido),
  valor_total_sem_frete = a.novo_valor_total_sem_frete,
  valor_total = a.novo_valor_total_sem_frete + COALESCE(a.valor_frete,0),
  updated_at = now()
FROM ajuste a
WHERE pv.id = a.id;