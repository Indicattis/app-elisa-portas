

## Plano: Corrigir cálculo do Tamanho Total usando campo `tamanho`

### Problema

O cálculo atual só considera `largura * altura`, mas muitos itens têm as dimensões no campo `tamanho` (string como "3.00 x 2.50") sem `largura`/`altura` preenchidos numericamente.

### Alteração

**Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

No `useMemo` de `itensAgrupadosPorEtapa`, alterar o cálculo de `area`:

1. Se `largura` e `altura` existem, usar `largura * altura`
2. Senão, tentar fazer parse do campo `tamanho` com regex `(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)` para extrair largura e altura
3. Multiplicar a área resultante pela quantidade

Esse padrão de fallback já é usado em `usePedidosAprovacaoCEO.ts` (linhas 73-76 e 117-120).

### Detalhes técnicos

```typescript
// Antes
const area = (item.largura && item.altura) ? item.largura * item.altura : 0;

// Depois
let area = 0;
if (item.largura && item.altura) {
  area = item.largura * item.altura;
} else if (item.tamanho) {
  const match = item.tamanho.match(/(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)/);
  if (match) {
    area = parseFloat(match[1].replace(',', '.')) * parseFloat(match[2].replace(',', '.'));
  }
}
```

Nenhum outro arquivo precisa ser alterado — o hook já retorna `tamanho`.

