
INSERT INTO despesas_mensais (mes, nome, modalidade, categoria, valor_real, valor_esperado, observacoes, tipo_status, created_by)
SELECT 
  cm.mes,
  tc.nome,
  CASE WHEN tc.tipo = 'fixa' THEN 'fixa' ELSE 'projetada' END as modalidade,
  CASE WHEN tc.tipo = 'fixa' THEN 'Despesas fixas' ELSE 'Despesas variáveis' END as categoria,
  cm.valor_real,
  0 as valor_esperado,
  cm.observacoes,
  'decretada' as tipo_status,
  cm.created_by
FROM custos_mensais cm
JOIN tipos_custos tc ON tc.id = cm.tipo_custo_id
WHERE NOT EXISTS (
  SELECT 1 FROM despesas_mensais dm 
  WHERE dm.mes = cm.mes AND dm.nome = tc.nome
);
