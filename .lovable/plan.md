

# Adicionar opcao "Ja foi pago" em cada metodo de pagamento

## Problema

Atualmente, apenas o metodo "A Vista" gera contas a receber com status "pago". Os demais metodos (Boleto, Cartao, Dinheiro) sempre geram como "pendente". O vendedor precisa poder marcar que o pagamento ja foi recebido no momento da criacao da venda.

## Mudancas

### 1. Adicionar campo `ja_pago` na interface `MetodoPagamento`

**Arquivo:** `src/components/vendas/MetodoPagamentoCard.tsx`

- Adicionar `ja_pago: boolean` na interface `MetodoPagamento`
- Adicionar `ja_pago: false` no `createEmptyMetodo()`
- Renderizar um checkbox/switch "Ja foi pago?" abaixo dos campos comuns (valor, data, empresa), visivel para todos os tipos de pagamento
- Usar o componente `Checkbox` com label estilizado no tema escuro

### 2. Passar o flag `ja_pago` na geracao de contas a receber

**Arquivo:** `src/hooks/useVendas.ts`

- Alterar a funcao `gerarContasReceberPorMetodo` para usar `metodo.ja_pago`
- Nos casos `boleto`, `cartao_credito` e `dinheiro`: se `metodo.ja_pago === true`, definir `status: 'pago'`, `data_pagamento` e `valor_pago` (igual ao valor da parcela) em cada parcela gerada
- O caso `a_vista` ja gera como pago, entao nao precisa de alteracao

### Resumo dos arquivos

1. `src/components/vendas/MetodoPagamentoCard.tsx` - Adicionar campo `ja_pago` na interface e checkbox na UI
2. `src/hooks/useVendas.ts` - Usar `ja_pago` ao gerar contas a receber

