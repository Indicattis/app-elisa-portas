

# Permitir Texto no Campo "Valor a Receber" na Gestao de Fabrica

## Resumo

Atualmente o campo "Valor a Receber" aceita apenas numeros. A alteracao permitira que o usuario digite texto livre (ex: "2x R$500", "Entrada + parcela", notas) alem de valores numericos.

## Abordagem

Adicionar uma nova coluna `valor_a_receber_texto` (text) na tabela `vendas` para armazenar o texto livre. O campo numerico `valor_a_receber` sera mantido para compatibilidade com calculos financeiros existentes (contas a receber, cobrancas, etc). A exibicao priorizara o texto quando existir.

## 1. Migration - Nova coluna na tabela vendas

```sql
ALTER TABLE public.vendas 
ADD COLUMN valor_a_receber_texto TEXT DEFAULT NULL;
```

## 2. Alterar o Popover de edicao no PedidoCard

**Arquivo:** `src/components/pedidos/PedidoCard.tsx`

- Mudar o input de `type="number"` para `type="text"` com placeholder "Ex: 1.500,00 ou texto"
- No `handleAbrirPopoverValor`: carregar `valor_a_receber_texto` se existir, senao o valor numerico
- No `handleSalvarValorAReceber`:
  - Tentar parsear como numero (removendo pontos de milhar, trocando virgula por ponto)
  - Se for numero valido: salvar em `valor_a_receber` (number) e em `valor_a_receber_texto` (o texto original)
  - Se nao for numero: salvar em `valor_a_receber_texto` (text) e setar `valor_a_receber` como `null`

## 3. Alterar a exibicao do valor no PedidoCard

**Arquivo:** `src/components/pedidos/PedidoCard.tsx`

- No grid view (linha ~1559) e mobile view (linha ~2207):
  - Se `valor_a_receber_texto` existir, exibir o texto diretamente (sem formatCurrency)
  - Se nao, manter comportamento atual com `formatCurrency(valor_a_receber)`
- Na exibicao read-only (faturamento, linhas ~1536 e ~2189): mesma logica - priorizar texto

## 4. Incluir campo na query de pedidos

**Arquivo:** `src/hooks/usePedidosEtapas.ts`

- Adicionar `valor_a_receber_texto` no select de vendas

## 5. Incluir campo no faturamento

**Arquivo:** `src/pages/FaturamentoEdit.tsx`

- O campo de valor a receber no faturamento continuara aceitando apenas numeros (manter `type="number"`), pois e usado para calculo financeiro

## Resultado esperado

- O usuario pode digitar tanto numeros quanto texto livre no campo "Valor a Receber"
- Se digitar um numero, ele e salvo tanto como numero (para calculos) quanto como texto (para exibicao)
- Se digitar texto puro, o valor numerico fica null e o texto e exibido
- Exibicao prioriza o texto quando disponivel
- Calculos financeiros (cobrancas, contas a receber) continuam usando o campo numerico
- Campo bloqueado por faturamento continua funcionando normalmente
