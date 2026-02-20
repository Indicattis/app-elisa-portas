
# Adicionar Colunas de Valor da Venda e Valor a Receber na Gestao de Fabrica

## Resumo

Adicionar duas novas colunas na listagem de pedidos (PedidoCard em modo lista):
- **Valor da Venda**: sempre visivel, mostrando o `valor_venda` da venda associada
- **Valor a Receber**: visivel apenas quando a venda tem `pagamento_na_entrega = true`, mostrando o `valor_a_receber`

## Alteracoes

### 1. Hook `src/hooks/usePedidosEtapas.ts`

Adicionar `pagamento_na_entrega` e `valor_a_receber` na query de select da tabela `vendas` (ao lado de `valor_venda` que ja existe, por volta da linha 129):

```
vendas:venda_id (
  ...
  valor_venda,
  pagamento_na_entrega,
  valor_a_receber,
  ...
)
```

### 2. Componente `src/components/pedidos/PedidoCard.tsx`

Na secao do layout em lista (viewMode === 'list', a partir da linha 1036):

- Adicionar duas colunas no grid template (antes da coluna de tempo/acoes):
  - Uma coluna de ~65px para "Valor Venda"
  - Uma coluna de ~65px para "Valor a Receber"
- Renderizar o valor da venda formatado com `formatCurrency` (ja importado)
- Renderizar o valor a receber apenas se `venda?.pagamento_na_entrega` for true, caso contrario exibir "---"
- O valor a receber tera destaque visual (cor laranja/amber) para chamar atencao

### Detalhes visuais

- Valor da Venda: texto pequeno (text-[10px]) em cor neutra
- Valor a Receber: texto pequeno com badge amber/laranja indicando pagamento na entrega, visivel apenas quando aplicavel
- Tooltip no valor a receber explicando "Pagamento na entrega"

### Arquivos modificados

- `src/hooks/usePedidosEtapas.ts` - adicionar campos na query
- `src/components/pedidos/PedidoCard.tsx` - adicionar 2 colunas no grid da lista
