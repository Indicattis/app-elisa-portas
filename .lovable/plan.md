

# Fix: Numeracao duplicada de portas nos cards

## Problema

A numeracao das pastas usa `indice_porta` que e relativo a cada `produto_venda_id`. Como existem 4 produtos de venda diferentes neste pedido, cada um comeca do indice 0, resultando em multiplas "Porta de Enrolar #1".

Dados do pedido:
- `produto_venda_id` A: indice 0 -> "#1"
- `produto_venda_id` B: indices 0, 1, 2 -> "#1", "#2", "#3"
- `produto_venda_id` C: indices 0, 1 -> "#1", "#2"
- `produto_venda_id` D: indice 0 -> "#1"

Resultado: tres pastas chamadas "#1", duas "#2", etc.

## Solucao

Atribuir numeracao sequencial global apos o agrupamento, contando todas as portas do mesmo tipo em ordem. Assim teremos:

- Porta de Enrolar #1 (4.61m x 5.00m)
- Porta de Enrolar #2 (4.75m x 6.00m)
- Porta de Enrolar #3 (4.75m x 6.00m)
- Porta de Enrolar #4 (4.75m x 6.00m)
- Porta de Enrolar #5 (4.72m x 6.00m)
- Porta de Enrolar #6 (4.72m x 6.00m)
- Porta de Enrolar #7 (4.65m x 6.00m)

## Detalhe tecnico

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

No `useMemo` de `gruposPortas` (linhas 212-243), apos construir os grupos no Map, fazer um segundo passo para renumerar sequencialmente por tipo de produto:

```typescript
// Apos construir o map...
const grupos = [...map.values()];

// Renumerar sequencialmente por tipo
const contadorPorTipo = new Map<string, number>();
grupos.forEach(grupo => {
  if (grupo.key === 'sem_porta') return;
  // Extrair o tipo base (ex: "Porta de Enrolar")
  const match = grupo.label.match(/^(.+) #\d+$/);
  if (match) {
    const tipo = match[1];
    const count = (contadorPorTipo.get(tipo) || 0) + 1;
    contadorPorTipo.set(tipo, count);
    grupo.label = `${tipo} #${count}`;
  }
});

return grupos;
```

Apenas 1 arquivo modificado, apenas a logica de label muda.

