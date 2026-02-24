
# Agrupar contas a receber por metodo de pagamento

## O que sera feito

Na secao "Parcelas / Contas a Receber" da pagina de detalhe da venda, as parcelas serao agrupadas pelo campo `metodo_pagamento` em vez de exibidas em lista corrida. Cada grupo tera um cabecalho com o nome do metodo e o subtotal.

## Mudancas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**Substituir a renderizacao flat das parcelas (linhas 699-757) por uma renderizacao agrupada:**

1. Agrupar `contasReceber` por `metodo_pagamento` usando `Object.groupBy` ou reduce
2. Para cada grupo, exibir:
   - Cabecalho com o label do metodo (Boleto, A Vista, Cartao, Dinheiro) e o subtotal do grupo
   - Quantidade de parcelas pagas vs total
   - As parcelas do grupo (mesmo layout atual: valor, vencimento, status, textarea de observacao, botao marcar como pago)

### Estrutura visual

```text
Card "Parcelas / Contas a Receber"
  |
  +-- Grupo "Boleto" (5 parcelas - R$ 11.900,00)
  |     Parcela 1 - R$ 2.380,00 - 23/03/2026 - Pendente
  |     Parcela 2 - R$ 2.380,00 - 22/04/2026 - Pendente
  |     ...
  |
  +-- Grupo "Cartao de Credito" (3 parcelas - R$ 5.000,00)
        Parcela 1 - R$ 1.666,67 - ...
        ...
```

### Detalhes tecnicos

- Criar um objeto agrupado com reduce sobre `contasReceber`
- Iterar sobre `Object.entries(grouped)` para renderizar cada grupo
- Cada grupo tera um div com borda e cabecalho distinto (label do metodo + badge com contagem pago/total + subtotal)
- As parcelas dentro de cada grupo mantem o layout atual (observacoes, botao pago)
- Se houver apenas um metodo de pagamento, o visual sera praticamente igual ao atual, apenas com o cabecalho do grupo adicionado

### Arquivo alterado

1. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` - Agrupar parcelas por metodo de pagamento na secao de contas a receber
