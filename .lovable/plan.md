
# Corrigir loop infinito no auto-faturamento de pintura epoxi

## Problema
Quando o lucro calculado resulta em 0 (por exemplo, se `altura` ou `largura` for 0/null), o `updateLucroItem` salva `lucro_item = 0`. Na proxima renderizacao, o filtro `p.lucro_item === 0` encontra o produto novamente, dispara outro update, e assim infinitamente.

## Solucao
### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. Adicionar um `useRef` para rastrear quais produtos ja foram auto-faturados, evitando reprocessamento:

```typescript
const autoFaturadosRef = useRef<Set<string>>(new Set());
```

2. No `useEffect` (linha 265), adicionar verificacao contra o ref:

```typescript
const produtosPinturaParaAutoFaturar = produtos.filter(p => 
  p.tipo_produto === 'pintura_epoxi' && 
  (p.lucro_item === null || p.lucro_item === undefined || p.lucro_item === 0) &&
  !p.faturamento &&
  !autoFaturadosRef.current.has(p.id)
);
```

3. Marcar os produtos como processados antes de chamar o update:

```typescript
produtosPinturaParaAutoFaturar.forEach(async (produto) => {
  autoFaturadosRef.current.add(produto.id);
  // ... resto do calculo
});
```

Isso garante que cada produto seja auto-faturado apenas uma vez por sessao, quebrando o loop infinito.
