

## Dividir Coluna de Desconto em 3 Tiers

### O que muda
A coluna "Desc./Créd." será substituída por 3 sub-colunas mostrando quanto do desconto total se encaixa em cada faixa de autorização:

| Cartão (3%) | Gelo (5%) | Luan/Alana (5%) |
|---|---|---|
| Desc. à vista | Desc. presencial | Desc. c/ senha responsável |

### Lógica de cálculo
Para cada venda, o desconto total (%) é distribuído nas faixas em cascata:
1. **Cartão**: `min(desconto%, limite_avista)` — só se `forma_pagamento ≠ cartao_credito`
2. **Gelo**: `min(restante%, limite_presencial)` — só se `venda_presencial = true`
3. **Luan/Alana**: qualquer excedente acima das 2 faixas anteriores

Se a venda é com cartão de crédito, a faixa "Cartão" fica zerada e o desconto vai direto para "Gelo" (se presencial) ou "Luan/Alana".

### Alterações técnicas

**`src/pages/administrativo/FaturamentoVendasMinimalista.tsx`**:

1. **Query**: Adicionar `venda_presencial` e `forma_pagamento` ao select do Supabase
2. **Interface Venda**: Adicionar campos `venda_presencial?: boolean` e `forma_pagamento?: string`
3. **Colunas**: Substituir `desconto_acrescimo` por 3 colunas:
   - `desc_cartao` (label: "Cartão")
   - `desc_gelo` (label: "Gelo")  
   - `desc_responsavel` (label: "Luan/Alana")
4. **Buscar limites**: Usar `useConfiguracoesVendas()` para obter os limites configurados do banco
5. **Renderização**: Cada sub-coluna mostra o valor em R$ (vermelho) correspondente àquela faixa, ou `-` se zero. Crédito permanece na coluna existente ou será removido (já está no lucro)
6. **Sorting/alignment**: Manter text-right e hidden-on-mobile para as 3 novas colunas

### Exibição visual
- Valores em vermelho (`text-red-400`) com prefixo `-`
- Se o desconto daquela faixa = 0, mostra `-` em `text-white/30`
- Header com tooltip explicando cada faixa

