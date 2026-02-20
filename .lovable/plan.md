

# Corrigir botao de Arquivar na visualizacao em lista

## Problema real

O `ArquivarPedidoModal` nao esta sendo renderizado no bloco de retorno da visualizacao em lista (list view). O componente `PedidoCard` tem dois blocos de retorno separados:

- **Lista** (linhas 1017-1841): Contem o botao de arquivar (linha 1737) que faz `setShowArquivar(true)`, mas NAO renderiza o `ArquivarPedidoModal`
- **Grid** (linhas 1845-2287): Contem tanto o botao quanto o `ArquivarPedidoModal` (linha 2231) e o `ArquivamentoLoadingModal` (linha 2238)

Quando o usuario clica no botao de arquivar na lista, o estado `showArquivar` muda para `true`, mas nao existe nenhum componente modal para responder a esse estado. O modal simplesmente nao existe nesse caminho de renderizacao.

## Solucao

### Alteracao em `src/components/pedidos/PedidoCard.tsx`

Adicionar o `ArquivarPedidoModal` e o `ArquivamentoLoadingModal` no bloco de retorno da visualizacao em lista, antes do fechamento do fragmento (antes da linha 1841).

Inserir apos a linha 1840 (depois do `ExcluirPedidoModal`):

```typescript
        <ArquivarPedidoModal
          open={showArquivar}
          onOpenChange={setShowArquivar}
          onConfirmar={handleConfirmarArquivamento}
          pedido={pedido}
        />

        <ArquivamentoLoadingModal open={showArquivamentoLoading} />
```

Nenhuma outra alteracao e necessaria. O `stopPropagation` ja adicionado anteriormente continua correto e necessario.

## Resultado

- O modal de confirmacao de arquivamento aparecera corretamente ao clicar no botao na visualizacao em lista
- O modal de loading durante o arquivamento tambem funcionara
- Nenhum impacto na visualizacao em grid, que ja funciona corretamente

