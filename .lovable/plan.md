

# Adicionar linha de Credito/Desconto na tabela de produtos do faturamento

## Problema
A tabela de produtos na pagina de faturamento administrativo exibe linhas de Instalacao e Frete, mas nao mostra o valor de credito/desconto (`valor_credito`) da venda, mesmo ele sendo parte do valor total.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Adicionar uma nova linha na tabela de produtos, entre a linha do "Frete" e a linha do "Total Geral", exibindo o valor de credito/desconto da venda. A linha so sera renderizada quando `valor_credito > 0`.

**Detalhes da implementacao:**

1. **Nova linha condicional (apos linha 818):** Inserir uma `TableRow` com estilo similar ao do Frete (`bg-white/5`), exibindo:
   - Coluna label: "Credito / Acrescimo"
   - Coluna valor: `formatCurrency(venda.valor_credito)`
   - Informacao auxiliar: "Apenas visualizacao"

2. **Atualizar o calculo do Total Geral (linha 827):** Incluir `valor_credito` na soma para que o total reflita corretamente:
   - De: `SUM(valor_total) + valor_frete`
   - Para: `SUM(valor_total) + valor_frete + valor_credito`

Isso garante que o "Total Geral" da tabela bata com o "Valor Total" exibido nos cards superiores.
