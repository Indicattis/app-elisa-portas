
# Adicionar botao de Arquivo Morto na view de lista dos pedidos finalizados

## Problema
O botao de arquivar pedido so existe na renderizacao em modo "grid" do PedidoCard (linha 2023). Na renderizacao em modo "list" (usada na gestao de fabrica), o bloco de botoes de acao para pedidos finalizados nao inclui o botao de arquivamento - apenas o botao "Enviar para Correcao".

## Alteracao

### `src/components/pedidos/PedidoCard.tsx`
No bloco de botoes de acao da view "list" (por volta da linha 1629-1651), adicionar o botao de arquivar logo apos o bloco do botao "Enviar para Correcao":

- Apos a linha 1651 (fim do bloco `enviar-correcao`), adicionar um novo bloco condicional:
  - Condicao: `etapaAtual === 'finalizado' && onArquivar`
  - Renderizar um botao com icone `Archive` no array `avancarButtons` (ou `middleButtons`), com estilo laranja (consistente com o botao da view grid: `bg-orange-500/10 text-orange-700`)
  - Tamanho `h-[20px] w-[20px] rounded-[3px]` (consistente com os outros botoes da view list)
  - onClick abre o modal `setShowArquivar(true)`

O modal `ArquivarPedidoModal` e o `ArquivamentoLoadingModal` ja estao renderizados na view list (linhas 1726+), entao nenhuma outra alteracao e necessaria.

### Arquivo afetado
- `src/components/pedidos/PedidoCard.tsx` (apenas 1 arquivo, ~10 linhas adicionadas)
