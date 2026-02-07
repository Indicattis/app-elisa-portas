
# Permitir reordenacao manual na etapa "Em Aberto"

## Problema

Na etapa "Em Aberto" de `/direcao/gestao-fabrica`, existe uma ordenacao fixa por nome de cor (alfabetica) que **sobrescreve** qualquer alteracao manual de prioridade. Quando voce tenta mover um pedido galvanizado para o topo usando as setas ou drag-and-drop, a prioridade e salva no banco (`prioridade_etapa`), mas na proxima renderizacao o sort por cor reordena tudo, ignorando a prioridade.

## Solucao

Alterar a logica de ordenacao na etapa "aberto" para usar `prioridade_etapa` como criterio principal e a cor como criterio de desempate. Assim, pedidos com prioridade manual definida ficam no topo, e entre pedidos com mesma prioridade, a ordenacao por cor e mantida.

## Detalhe tecnico

### Arquivo: `src/hooks/usePedidosEtapas.ts` (linhas 325-338)

**De:**
```typescript
if (etapa === 'aberto') {
  return pedidosComBacklog.sort((a, b) => {
    const corA = extrairPrimeiraCor(a);
    const corB = extrairPrimeiraCor(b);
    
    if (!corA && !corB) return 0;
    if (!corA) return 1;
    if (!corB) return -1;
    
    return corA.localeCompare(corB, 'pt-BR');
  });
}
```

**Para:**
```typescript
if (etapa === 'aberto') {
  return pedidosComBacklog.sort((a, b) => {
    // Prioridade manual tem precedencia (maior primeiro)
    const prioA = (a as any).prioridade_etapa || 0;
    const prioB = (b as any).prioridade_etapa || 0;
    if (prioB !== prioA) return prioB - prioA;

    // Desempate por cor (alfabetica)
    const corA = extrairPrimeiraCor(a);
    const corB = extrairPrimeiraCor(b);
    
    if (!corA && !corB) return 0;
    if (!corA) return 1;
    if (!corB) return -1;
    
    return corA.localeCompare(corB, 'pt-BR');
  });
}
```

Isso garante que:
- Pedidos com prioridade manual mais alta aparecem primeiro
- Pedidos com mesma prioridade continuam agrupados por cor
- O drag-and-drop e as setas de prioridade funcionam corretamente

## Arquivo modificado

1. **Editar**: `src/hooks/usePedidosEtapas.ts`
