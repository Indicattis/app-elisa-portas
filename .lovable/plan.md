

## Aumentar margem fixa de instalação de 30% para 40%

### Alterações de código

**1. `src/pages/direcao/DREMesDirecao.tsx` (linha 278)**
- `luc.instalacoes = fat.instalacoes * 0.30` → `* 0.40`

**2. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`**
Trocar `* 0.30` por `* 0.40` em três pontos:
- Linha 545 — auto-faturamento de produtos `instalacao` (vendas novas).
- Linha 618 — cálculo de `lucroInstalacao` no `executarFaturamento` (vendas legadas com `valor_instalacao` na própria venda).
- Linha 695 — `lucroInstalacaoCalculado` exibido na tela antes do faturamento.

### Recalcular vendas já faturadas de 2026

Para que o DRE de meses já fechados (e a coluna Lucro do detalhe da venda) reflitam 40%, atualizar via SQL:

1. **Produtos do tipo `instalacao`** (vendas novas, com `faturamento = true`) em vendas de 2026:
   - `lucro_item = valor_total_sem_frete * 0.40`
   - `custo_producao = valor_total_sem_frete * 0.60`

2. **Vendas legadas** (sem produto `instalacao`, com `valor_instalacao > 0` e `instalacao_faturada = true`) de 2026:
   - `lucro_instalacao = valor_instalacao * 0.40`
   - `custo_instalacao = valor_instalacao * 0.60`

3. Recalcular `lucro_total` das vendas afetadas (somando os novos `lucro_item` + `lucro_instalacao`).

### Fora de escopo
- Não altera vendas de anos anteriores (filtro: `data_venda >= '2026-01-01'`).
- Não altera o `LucroItemModal` (entrada manual continua livre).
- Não cria configuração dinâmica de margem — segue como constante no código.

