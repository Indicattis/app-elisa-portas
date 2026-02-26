

# Adicionar botoes de acao na pagina de Cobrancas

## Resumo

A pagina de Cobrancas (`/administrativo/financeiro/cobrancas`) usa o mesmo componente `PedidosDraggableList` com `etapa="finalizado"`, mas nao passa os callbacks de acao (`onArquivar`, `onDeletar`). O `PedidoCard` ja possui toda a logica dos botoes (arquivar, enviar para correcao, excluir) condicionada a `etapa === 'finalizado'` e a presenca dessas props. Basta conectar os hooks e passar as props.

## Mudancas

### Arquivo: `src/pages/administrativo/CobrancasMinimalista.tsx`

1. **Importar o hook `usePedidosEtapas`** (ja usado na gestao de fabrica) para obter `arquivarPedido` e `deletarPedido`
2. **Criar handlers** `handleArquivar` e `handleDeletarPedido` identicos aos da gestao de fabrica
3. **Passar as props** `onArquivar` e `onDeletar` ao componente `PedidosDraggableList`
4. **Importar `useNeoInstalacoesFinalizadas` e `useNeoCorrecoesFinalizadas`** com as funcoes `arquivarNeoInstalacao` e `arquivarNeoCorrecao` (ja importados, so precisam usar as funcoes de arquivamento)
5. **Passar `onArquivar`** aos componentes `NeoInstalacaoCardGestao` e `NeoCorrecaoCardGestao`

### Resultado

Os cards de pedidos finalizados na pagina de cobrancas terao os mesmos botoes de acao da gestao de fabrica:
- Botao de arquivar (icone laranja)
- Botao de enviar para correcao (icone roxo)
- Botao de excluir pedido

Os cards de Neo Instalacoes e Correcoes tambem terao o botao de arquivar.
