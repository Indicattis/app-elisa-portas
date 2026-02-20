
# Remover botao "Editar" dos Itens do Pedido

## Resumo

Eliminar a necessidade de clicar em "Editar" para poder adicionar/remover linhas na secao "Itens do Pedido" em `/administrativo/pedidos/:id`. O editor ficara sempre ativo quando o pedido permitir edicao (`isAberto` ou `isEmProducao`).

## Alteracoes

### `src/pages/administrativo/PedidoViewMinimalista.tsx`

1. **Remover o botao "Editar"** e os botoes "Cancelar"/"Salvar" do header do card "Itens do Pedido" (linhas ~717-733)
2. **Alterar `isReadOnly`** de `!podeEditarLinhas || !modoEdicao` para apenas `!podeEditarLinhas` (linha ~747)
3. **Manter o aviso laranja** de propagacao para ordens quando `isEmProducao`, mas sem depender de `modoEdicao` -- exibir sempre que `isEmProducao && podeEditarLinhas`
4. **Manter os botoes "Salvar alteracoes"** apenas se houver alteracoes pendentes de edicao inline (quantidade/tamanho) -- mover para dentro do CardContent, visivel somente quando `temPendentesSalvamento`
5. Opcionalmente remover o state `modoEdicao` se nao for usado em nenhum outro lugar do componente
