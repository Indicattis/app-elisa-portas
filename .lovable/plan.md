

# Corrigir faturamento total: instalações vindas de fonte errada

## Problema identificado

A análise do trigger do banco confirma que:

```sql
-- Produto: valor_total_sem_frete = (valor_produto + valor_pintura + valor_instalacao) * qty - desconto
-- Venda: valor_venda = SUM(valor_total dos produtos) + valor_frete
-- Venda: valor_instalacao = SUM(produtos_vendas.valor_instalacao) -- valor BRUTO, sem desconto
```

Ou seja, `valor_total_sem_frete` de cada produto **já inclui** `valor_instalacao` (descontado proporcionalmente). E `vendas.valor_instalacao` é o valor **bruto** (sem desconto).

O código atual:
1. Para portas: computa `valorPortaLiquido + valorPinturaLiquido` (correto, mas **exclui** a parcela de instalação descontada)
2. Usa `vendas.valor_instalacao` (bruto) para `fat.instalacoes`

**Resultado**: a parcela de instalação descontada é substituída pela bruta, e a diferença de desconto é perdida. Além disso, para portas, `valorPortaLiquido + valorPinturaLiquido < valor_total_sem_frete` porque a fração de instalação foi removida. Isso causa a diferença de ~R$ 29.000.

## Solução

Extrair a parcela de instalação **dos próprios produtos** (descontada proporcionalmente), em vez de usar `vendas.valor_instalacao`. Assim:

```
valorPortaLiquido + valorPinturaLiquido + valorInstalacaoLiquido = valor_total_sem_frete
```

E o total fecha corretamente: `sum(valor_total_sem_frete) + sum(valor_credito) = faturamento real`.

### Alterações em `DREMesDirecao.tsx`

**1. No loop de portas (linhas 355-381)**: adicionar cálculo de `valorInstalacaoLiquido` e somar em `fat.instalacoes`:

```typescript
const proporcaoInstalacao = valorBrutoTotal > 0 ? valorInstalacaoBase / valorBrutoTotal : 0;
const valorInstalacaoLiquido = valorInstalacaoBase - (descontoTotal * proporcaoInstalacao);

fat.portas += valorPortaLiquido;
fat.pintura += valorPinturaLiquido;
fat.instalacoes += valorInstalacaoLiquido; // NOVO
```

**2. Remover `vendas.valor_instalacao` do faturamento (linhas 401, 408)**: não usar mais `totalFatInstalacao` para `fat.instalacoes` (que agora vem dos produtos). Manter a query de vendas apenas para `valor_credito` e `lucro_instalacao`.

**3. Lucro de instalação**: manter a lógica atual que usa `vendas.lucro_instalacao` com fallback de 30%, mas aplicar sobre o valor descontado (da fonte de produtos) em vez do bruto.

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx`

