

# Migrar dados de custos_mensais para despesas_mensais

## Problema
Os dados cadastrados em `/administrativo/financeiro/custos/2026-01` estão na tabela `custos_mensais` (14+ registros com valores reais). Após a refatoração do código para ler de `despesas_mensais`, a página aparece vazia porque `despesas_mensais` não tem esses registros.

## Solução
Executar uma migração SQL que copia os registros de `custos_mensais` para `despesas_mensais`, fazendo join com `tipos_custos` para obter o nome e tipo de cada custo.

### SQL de migração

```sql
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
```

Isso copia todos os registros sem duplicar (verifica se já existe pelo par `mes + nome`). Nenhum arquivo de código precisa ser alterado.

