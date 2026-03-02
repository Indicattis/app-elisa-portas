
# Corrigir modal "Processando Avanco de Etapa" congelado em /logistica/expedicao

## Problema
O `PedidosDraggableList` na pagina `ExpedicaoMinimalista.tsx` nao recebe as props `onMoverEtapa` e `onRetrocederEtapa`, apesar de ambos os handlers (`handleMoverEtapa` e `handleRetrocederEtapa`) ja existirem no componente (linhas 143-148).

Quando o usuario tenta avancar um pedido, o `PedidoCard` abre o modal de progresso (`ProcessoAvancoModal`), mas como `onMoverEtapa` e `undefined`, o bloco `if (onMoverEtapa)` e ignorado e o modal nunca fecha -- ficando congelado.

## Solucao

### Arquivo: `src/pages/logistica/ExpedicaoMinimalista.tsx`

Adicionar as duas props faltantes ao `PedidosDraggableList` (linha 938):

```typescript
onMoverEtapa={handleMoverEtapa}
onRetrocederEtapa={handleRetrocederEtapa}
```

Isso conecta os handlers ja existentes ao componente de lista, permitindo que o avanco e retrocesso de etapa funcione corretamente com o modal de progresso.
