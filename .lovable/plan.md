

# Incluir valor de instalação no "Valor" da tabela de vendas

## Problema

Na tabela de listagem de vendas (`FaturamentoVendasMinimalista.tsx`), a coluna "Valor" (linha 727) exibe apenas `valor_venda + valor_credito`, sem incluir `valor_instalacao`.

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`

Alterar a linha 727 para incluir `valor_instalacao`:

```
// De:
(venda.valor_venda || 0) + (venda.valor_credito || 0)

// Para:
(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)
```

Resultado: R$ 18.000 + R$ 0 + R$ 3.800 = R$ 21.800.

