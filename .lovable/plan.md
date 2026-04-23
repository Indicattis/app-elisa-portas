

## Diagnóstico: Venda 641a1ff0 sem produtos

A venda `WDL Vanderlei da Silva Esquadrias` (R$ 9.080,00, `frete_aprovado=true`, `custo_total=0`) **não tem nenhum registro na tabela `produtos_vendas`**:

```
SELECT * FROM produtos_vendas WHERE venda_id = '641a1ff0...' → 0 linhas
```

Por isso a seção **Produtos da Venda** aparece vazia em `/administrativo/financeiro/faturamento/641a1ff0...`. O frete foi marcado como aprovado e a venda tem valor, mas os itens nunca foram persistidos (ou foram excluídos).

### Possíveis causas

1. **Cadastro de venda interrompido** — a venda foi gravada (linha em `vendas` criada) mas o passo seguinte de inserir os itens em `produtos_vendas` falhou silenciosamente. Não há nenhum log recente em `postgres_logs` mencionando essa venda nem `produtos_vendas`.
2. **Exclusão manual posterior** — `updated_at` da venda é `2026-04-23 11:24:17` (hoje), bem depois do `created_at` (`2026-04-17 14:24:41`). Alguém pode ter editado/removido itens em algum fluxo administrativo.
3. **Origem em rascunho/outro fluxo** — a tabela `orcamentos` não tem coluna `venda_id` (apenas `lead_id`), portanto não dá pra rastrear o orçamento de origem por aqui.

### O que pode ser feito (escolha do usuário)

**Opção A — Corrigir esta venda manualmente**
Abrir a venda em `/vendas/minhas-vendas/<id>` (modo edição) e re-cadastrar as portas/produtos. Depois reabrir o faturamento.

**Opção B — Restaurar dos backups do Supabase**
Se houver backup PITR anterior a `2026-04-17 14:24:41`, restaurar as linhas de `produtos_vendas` daquela venda.

**Opção C — Investigar a origem (recomendado antes de A/B)**
Adicionar logs / verificar se há outras vendas afetadas:
```sql
SELECT v.id, v.cliente_nome, v.valor_venda, v.created_at
FROM vendas v
LEFT JOIN produtos_vendas p ON p.venda_id = v.id
WHERE v.is_rascunho = false
  AND v.valor_venda > 0
  AND p.id IS NULL;
```
Se aparecerem várias, é bug recorrente no cadastro/edição. Se for só esta, foi caso isolado.

### Próximo passo

Se quiser, posso:
- Rodar a query de auditoria (Opção C) para ver se outras vendas estão no mesmo estado, e
- Em seguida abrir um plano para corrigir esta venda específica (Opção A) ou implementar uma proteção (ex.: bloquear faturamento quando `produtos_vendas` está vazio).

Confirme qual caminho seguir.

