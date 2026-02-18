

# Corrigir numeracao inconsistente entre "Medidas das Portas" e "Itens do Pedido"

## Problema

A secao "Itens do Pedido" numera todas as portas sequencialmente (porta_enrolar + porta_social juntas), resultando em indices como:
- Porta de Enrolar #1
- Porta Social #2
- Porta de Enrolar #3

Ja a secao "Medidas das Portas de Enrolar" filtra apenas porta_enrolar e renumera do zero:
- Porta de Enrolar #1 (que na verdade e a #1 de cima)
- Porta de Enrolar #2 (que na verdade e a #3 de cima)

Isso gera confusao, pois o "#2" de uma secao nao corresponde ao "#2" da outra.

## Solucao

Alterar `MedidasPortasSection` para usar a mesma numeracao global das portas, mantendo consistencia com "Itens do Pedido".

### Alteracao em `src/components/pedidos/MedidasPortasSection.tsx`

1. Em vez de filtrar apenas `porta_enrolar` antes de expandir, expandir TODAS as portas primeiro (igual ao PedidoLinhasEditor faz)
2. Guardar o indice global de cada porta no array completo
3. Filtrar para mostrar apenas `porta_enrolar`, mas usando o indice global para o label

Concretamente:

```typescript
// Antes:
const portasRaw = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
const portas = expandirPortasPorQuantidade(portasRaw);

// Depois:
const todasPortas = produtos.filter(p => 
  p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta_social'
);
const todasExpandidas = expandirPortasPorQuantidade(todasPortas);
const portas = todasExpandidas
  .map((p, idx) => ({ ...p, _globalIndex: idx }))
  .filter(p => p.tipo_produto === 'porta_enrolar');
```

4. Usar `_globalIndex` em vez de `idx` ao chamar `getLabelPortaExpandida`, e trocar para `getLabelProdutoExpandido` (mesma funcao que "Itens do Pedido" usa) para consistencia total no formato do label

Resultado: "Porta de Enrolar #3" em "Medidas" correspondera exatamente a "Porta de Enrolar #3" em "Itens do Pedido".

