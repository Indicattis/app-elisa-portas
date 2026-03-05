

# Corrigir margem de lucro de instalações no DRE

## Problema raiz

No `DREMesDirecao.tsx`, o faturamento de instalações (`fat.instalacoes`) é calculado a partir dos **produtos** (com desconto proporcional aplicado), resultando em R$ 202.641. Porém, o lucro de instalações (`luc.instalacoes`) é calculado a partir de `vendas.valor_instalacao * 0.30`, que soma apenas R$ 173.600 — um número menor. O 30% sobre a base menor (R$ 52.080) dividido pelo faturamento maior (R$ 202.641) dá 25.7%, não 30%.

## Solução

No arquivo `src/pages/direcao/DREMesDirecao.tsx`, mudar o cálculo do lucro de instalações não faturadas para usar 30% sobre o faturamento de instalações já calculado a partir dos produtos (a mesma base), em vez de usar `vendas.valor_instalacao`.

### Mudança concreta (linhas ~357-422):

1. Durante o loop de produtos, acumular `fat.instalacoes` por `venda_id` num Map
2. Na query de vendas (linhas 405-419), para vendas **não faturadas**, usar 30% do faturamento de instalações acumulado por venda (do Map), em vez de `vendas.valor_instalacao * 0.30`
3. Para vendas **faturadas**, continuar usando `lucro_instalacao` do banco

Resultado esperado: margem de instalações = 30.0%

### Arquivo
- `src/pages/direcao/DREMesDirecao.tsx` (linhas 357-422)

