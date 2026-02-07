

# Fix: Erro ao aprovar pedido na etapa Aprovacao CEO

## Problema

Ao clicar "Aprovar" em `/direcao/aprovacoes/fabrica`, o sistema tenta mover o pedido para a proxima etapa mas a validacao de checkboxes obrigatorios bloqueia o avanco. A etapa `aprovacao_ceo` tem 2 checkboxes obrigatorios definidos em `ETAPAS_CONFIG`, e a chamada em `usePedidosAprovacaoCEO.ts` nao envia `skipCheckboxValidation: true`.

## Causa raiz

Em `src/hooks/usePedidosAprovacaoCEO.ts`, linha 197:

```typescript
await moverParaProximaEtapa.mutateAsync({ pedidoId });
```

Falta o parametro `skipCheckboxValidation: true`.

## Solucao

Adicionar `skipCheckboxValidation: true` na chamada de `moverParaProximaEtapa` dentro do `aprovarPedido` mutation, ja que a aprovacao do CEO e por si so a validacao necessaria — nao precisa de checkboxes.

## Detalhe tecnico

### Arquivo: `src/hooks/usePedidosAprovacaoCEO.ts`

Linha 197, alterar de:
```typescript
await moverParaProximaEtapa.mutateAsync({ pedidoId });
```

Para:
```typescript
await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation: true });
```

Apenas 1 linha alterada em 1 arquivo.
