
# Ocultar botoes de correcao e arquivar na aba Finalizado em /logistica/expedicao

## Problema

Na pagina `/logistica/expedicao`, a aba "Finalizado" mostra botoes de "Enviar para Correcao" e "Arquivar" nos cards de pedidos. Esses botoes nao devem aparecer nesta pagina.

## Solucao

No arquivo `src/pages/logistica/ExpedicaoMinimalista.tsx`, o componente `PedidosDraggableList` recebe `onArquivar={handleArquivar}` para todas as abas. Para a aba `finalizado`, basta nao passar `onArquivar`, o que remove o botao de arquivar. O botao de correcao ja esta oculto via `hideCorrecaoButton={true}`.

### Alteracao em `src/pages/logistica/ExpedicaoMinimalista.tsx` (linha 864)

Condicionar o `onArquivar` para nao ser passado na aba finalizado:

```
onArquivar={etapa === 'finalizado' ? undefined : handleArquivar}
```

## Resultado esperado

- Na aba "Finalizado" de `/logistica/expedicao`, os cards de pedidos nao mostram botao de arquivar nem de enviar para correcao
- Nas demais abas, o comportamento permanece inalterado
