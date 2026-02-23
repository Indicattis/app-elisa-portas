

# Valor a Receber no Faturamento e Gestao de Fabrica

## Resumo

Ao faturar uma venda, o usuario passara a informar o "valor a receber" pendente. Na gestao de fabrica, esse valor aparecera normalmente, mas se foi preenchido durante o faturamento, nao podera ser editado.

## 1. Adicionar coluna de controle na tabela `vendas`

Nova coluna booleana `valor_a_receber_faturamento` (default false) para rastrear se o valor foi definido durante o faturamento:

```sql
ALTER TABLE public.vendas 
ADD COLUMN valor_a_receber_faturamento BOOLEAN NOT NULL DEFAULT false;
```

## 2. Adicionar campo de valor a receber na pagina de faturamento

Arquivo: `src/pages/FaturamentoEdit.tsx`

- Adicionar estado `valorAReceber` (string, inicializado com o valor existente da venda)
- Renderizar um campo de input numerico "Valor a Receber (R$)" na area de resumo/botoes, antes do botao "Faturar"
- O campo so aparece quando a venda nao esta faturada

## 3. Salvar valor a receber ao faturar

Arquivo: `src/hooks/useProdutosVenda.ts`

- Adicionar parametro `valorAReceber` (opcional, number) na mutation `finalizarFaturamento`
- No update da venda, incluir `valor_a_receber` e `valor_a_receber_faturamento: true` quando o valor for informado

```typescript
finalizarFaturamentoMutation.mutateAsync({
  vendaId: venda.id,
  custoTotal,
  lucroTotal,
  produtosIds,
  valorAReceber: parseFloat(valorAReceber) || 0,
});
```

## 4. Incluir campo de controle na query de pedidos

Arquivo: `src/hooks/usePedidosEtapas.ts`

- Adicionar `valor_a_receber_faturamento` na query de vendas (linha 131, junto com `valor_a_receber`)

## 5. Bloquear edicao no PedidoCard quando definido no faturamento

Arquivo: `src/components/pedidos/PedidoCard.tsx`

- No grid view (linha 1531): se `venda?.valor_a_receber_faturamento === true`, exibir o valor como texto estatico (sem Popover), apenas mostrando o valor formatado
- No mobile/lista view (linha 2164): mesma logica - exibir como texto sem interacao
- Manter a exibicao visual (cor verde esmeralda quando tem valor)

## 6. Resetar flag ao remover faturamento

Arquivo: `src/hooks/useFaturamento.ts`

- Na mutation `removerFaturamento`, adicionar `valor_a_receber_faturamento: false` e `valor_a_receber: null` ao update da venda

## Resultado esperado

- Ao faturar: campo opcional "Valor a Receber" disponivel; valor salvo junto com o faturamento
- Na gestao de fabrica: valor aparece normalmente; se preenchido no faturamento, nao pode ser editado (exibido como texto)
- Se preenchido manualmente na gestao (sem faturamento), continua editavel
- Ao remover faturamento: valor e flag sao resetados
