
# Cadastrar Valor a Receber na Gestao de Fabrica

## Resumo

Permitir que o usuario cadastre o `valor_a_receber` diretamente no card do pedido em `/direcao/gestao-fabrica` quando esse valor nao estiver preenchido. Ao clicar no "---" ou no valor vazio, abre um popover/inline input para digitar o valor e salvar no banco.

## Comportamento

```text
ATUAL:
  - pagamento_na_entrega = true  -> mostra badge ambar com valor
  - pagamento_na_entrega = false -> mostra "---" (nao clicavel)

NOVO:
  - pagamento_na_entrega = true  -> mostra badge ambar com valor (clicavel para editar)
  - valor_a_receber > 0          -> mostra valor em emerald (clicavel para editar)
  - valor_a_receber = 0 ou null  -> mostra botao "+" ou "R$" clicavel
  - Ao clicar, abre Popover com input de valor + botao Salvar
  - Salva diretamente na tabela `vendas` (campo valor_a_receber)
  - Invalida queries para atualizar a listagem
```

## Alteracoes

### PedidoCard.tsx - Coluna "Valor a Receber" (modo lista, ~linha 1475)

**Substituir** o bloco atual (que mostra badge ambar ou "---") por:

1. Se `valor_a_receber > 0`: mostrar o valor formatado (clicavel para editar via Popover)
2. Se `valor_a_receber` e 0/null: mostrar um botao discreto "+" que abre o Popover
3. O **Popover** contera:
   - Input type="number" com placeholder "0,00" e label "Valor a Receber (R$)"
   - Botao "Salvar" que faz `supabase.from('vendas').update({ valor_a_receber }).eq('id', venda_id)`
   - Botao "Cancelar"
4. Apos salvar: `queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] })`
5. Manter o badge ambar quando `pagamento_na_entrega = true`
6. Tambem adicionar a mesma funcionalidade no layout mobile do card (~linha 2070)

### Imports necessarios

- Adicionar `Popover, PopoverContent, PopoverTrigger` de `@/components/ui/popover`
- Adicionar `Input` de `@/components/ui/input`
- Adicionar `useQueryClient` de `@tanstack/react-query`
- Adicionar `useState` (ja importado)

### Arquivo modificado

1. `src/components/pedidos/PedidoCard.tsx` - Adicionar popover de edicao do valor a receber
