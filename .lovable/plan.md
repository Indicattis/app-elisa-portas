

# Corrigir erro 400 ao inserir item no pedido

## Problema

Ao tentar adicionar um item ao pedido `fb954ee7-...`, ocorre o erro `invalid input syntax for type uuid: ""`. Isso acontece porque os campos `produto_venda_id` e `estoque_id` na tabela `pedido_linhas` sao do tipo UUID e aceitam `null`, mas o codigo envia uma string vazia `""` em vez de `null`.

O operador `??` (nullish coalescing) so converte `undefined` e `null`, mas nao converte `""` (string vazia). Portanto, `"" ?? null` resulta em `""`, que o Postgres rejeita como UUID invalido.

## Solucao

No arquivo `src/hooks/usePedidoLinhas.ts`, na funcao de insercao (linhas 97-118), trocar `??` por `||` nos campos UUID opcionais para que strings vazias tambem sejam convertidas em `null`:

```text
// Antes:
produto_venda_id: linha.produto_venda_id ?? null,
estoque_id: linha.estoque_id ?? null,

// Depois:
produto_venda_id: linha.produto_venda_id || null,
estoque_id: linha.estoque_id || null,
```

## Arquivo modificado

1. `src/hooks/usePedidoLinhas.ts` - linhas 101 e 109: trocar `??` por `||` para `produto_venda_id` e `estoque_id`

