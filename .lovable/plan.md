
# Adicionar botao de enviar para correcoes na listagem de pedidos em /logistica/expedicao

## Resumo

Na pagina `/logistica/expedicao`, a listagem de pedidos nas abas (Aguardando Coleta, Instalacoes, etc.) esta com `hideCorrecaoButton={true}`, o que oculta o botao roxo de "Enviar para Correcoes" que foi implementado recentemente. A correcao consiste em remover essa restricao para que o botao apareca nas etapas relevantes.

## Alteracao

### `src/pages/logistica/ExpedicaoMinimalista.tsx`

- **Linha 870**: Remover a prop `hideCorrecaoButton={true}` do componente `PedidosDraggableList` (ou alterar para `hideCorrecaoButton={false}`).

Isso fara com que o botao roxo "Enviar para Correcoes" apareca nos cards de pedidos nas etapas `aguardando_coleta` e `instalacoes`, permitindo encaminhar pedidos para a etapa de correcoes diretamente pela listagem da expedicao.
