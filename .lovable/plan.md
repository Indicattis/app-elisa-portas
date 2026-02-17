

# Corrigir botao de concluir neos na etapa finalizados

## Problema identificado

Na pagina `/direcao/gestao-fabrica`, quando a aba "Finalizado" esta ativa e nao existem pedidos finalizados (apenas neos finalizados), a secao de neos finalizados nao e renderizada.

Isso acontece porque a condicao de estado vazio (linha 475) nao leva em consideracao os neos finalizados:

```
pedidosFiltrados.length === 0 
  && !(etapaAtiva === 'instalacoes' && neoInstalacoes.length > 0) 
  && !(etapaAtiva === 'correcoes' && neoCorrecoes.length > 0)
```

Quando `pedidosFiltrados` esta vazio e a etapa e `finalizado`, o sistema mostra "Nenhum pedido nesta etapa" e pula todo o bloco que renderiza os neos finalizados, impedindo qualquer interacao com eles.

## Solucao

Adicionar a verificacao de neos finalizados na condicao de estado vazio, seguindo o mesmo padrao ja usado para `instalacoes` e `correcoes`.

### Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`

Alterar a condicao na linha 475 para incluir:

```
&& !(etapaAtiva === 'finalizado' && (neoInstalacoesFinalizadas.length > 0 || neoCorrecoesFinalizadas.length > 0))
```

Isso garante que, quando houver neos finalizados, o bloco inteiro sera renderizado corretamente, incluindo os cards com os botoes de retornar (undo).

## Resultado esperado

- Na aba "Finalizado", mesmo que nao haja pedidos, os neos finalizados serao exibidos
- Os botoes de retornar (undo) nos cards de neos finalizados funcionarao normalmente
