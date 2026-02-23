

# Igualar colunas do faturamento administrativo com o da direcao

## Resumo

Substituir as colunas da tabela em `/administrativo/financeiro/faturamento/vendas` para usar exatamente as mesmas 11 colunas da pagina `/direcao/faturamento`.

## Colunas atuais (admin) vs. desejadas (direcao)

Atuais (15 colunas): vendedor, cliente, data, cidade, pagamento, data_pgto_1, data_pgto_2, valor_frete, valor_instalacao, desconto_acrescimo, tempo_sem_faturar, justificativa, lucro_total, valor_total, faturada

Desejadas (11 colunas): vendedor (-), cliente, data, cidade, expedicao, desconto_acrescimo, valor, lucro, tempo_sem_faturar, justificativa, faturada

## Mudancas no `FaturamentoVendasMinimalista.tsx`

### 1. Atualizar `COLUNAS_DISPONIVEIS`
Substituir o array por:
- `vendedor` (label: "-")
- `cliente` (label: "Cliente")
- `data` (label: "Data")
- `cidade` (label: "Cidade")
- `expedicao` (label: "Expedicao") -- novo, substitui pagamento
- `desconto_acrescimo` (label: "Desc./Acres.")
- `valor` (label: "Valor") -- substitui valor_total
- `lucro` (label: "Lucro") -- substitui lucro_total
- `tempo_sem_faturar` (label: "Tempo s/ Faturar")
- `justificativa` (label: "Justificativa")
- `faturada` (label: "Faturada")

Remover: pagamento, data_pgto_1, data_pgto_2, valor_frete, valor_instalacao

### 2. Atualizar `renderCell`
- Remover cases: `pagamento`, `data_pgto_1`, `data_pgto_2`, `valor_frete`, `valor_instalacao`, `lucro_total`, `valor_total`
- Adicionar case `expedicao`: icone Hammer (instalacao) ou Truck (entrega)
- Renomear `valor_total` para `valor`: exibir `formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))`
- Renomear `lucro_total` para `lucro`: manter calculo de lucro existente, mostrar apenas se faturada

### 3. Atualizar `getColumnAlignment` e `getColumnResponsiveClass`
- Remover referencias as colunas removidas
- Adicionar `expedicao` com alinhamento centralizado
- Ajustar `valor` e `lucro` com alinhamento a direita

### 4. Atualizar `handleSort`
- Remover ordenacao para colunas removidas
- Adicionar ordenacao para `expedicao` (por tipo_entrega)

## Arquivo modificado
1. `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`
