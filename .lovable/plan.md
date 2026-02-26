

# Remover "Parcelas Previstas" da secao de Informacoes de Pagamento

## Problema

A secao "Informacoes de Pagamento" exibe "Parcelas Previstas" calculadas estaticamente a partir dos dados da venda (metodo, numero de parcelas, intervalo). Porem, essas parcelas nao estao vinculadas aos registros reais de "Contas a Receber" abaixo. Quando o usuario exclui todas as contas a receber, as parcelas previstas continuam aparecendo, causando confusao.

## Solucao

Remover o bloco "Parcelas Previstas" da secao de Informacoes de Pagamento, ja que as parcelas reais sao gerenciadas na secao "Parcelas / Contas a Receber" logo abaixo. Os dados de pagamento (metodo, numero de parcelas, intervalo, comprovante) continuam sendo exibidos normalmente.

## Mudanca

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

- Remover o bloco de codigo que calcula e renderiza as "Parcelas Previstas" (aproximadamente linhas 809-855) dentro da Card de Informacoes de Pagamento
- Manter todo o restante da secao: metodo, parcelas, intervalo, data da venda, pagamento na entrega, valor de entrada e comprovante

