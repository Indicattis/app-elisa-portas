

# Corrigir nome dos Acessorios e Adicionais na lista de produtos

## Problema

Na lista de itens da venda (dentro do PedidoDetalhesSheet), acessorios e adicionais mostram apenas o tipo generico ("8x Adicional") em vez do nome/descricao real do item (ex: "8x Fechadura Tetra").

Isso acontece porque o codigo usa um `nomeMap` que traduz o `tipo_produto` para um label fixo, e a descricao real so aparece como subtexto secundario abaixo.

## Solucao

No arquivo `src/components/pedidos/PedidoDetalhesSheet.tsx`, para tipos `acessorio` e `adicional`, usar a `descricao` do produto como nome principal (quando disponivel), em vez do label generico.

### Alteracao (linha 557)

De:
```ts
const nome = nomeMap[tipo] || tipo;
```

Para:
```ts
const nome = (tipo === 'acessorio' || tipo === 'adicional') && (produto.descricao || produto.nome)
  ? (produto.descricao || produto.nome)
  : (nomeMap[tipo] || tipo);
```

Alem disso, remover o subtexto redundante nas linhas 595-597 (que mostrava a descricao embaixo), ja que agora ela faz parte do nome principal.

### Resultado

- "8x Adicional" passa a ser "8x Fechadura Tetra" (ou o nome real do item)
- Se nao houver descricao, continua mostrando "Adicional" como fallback
- 1 arquivo modificado, 1 trecho alterado

