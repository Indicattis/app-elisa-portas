

## Plano: Corrigir "Tamanho Total" para metros lineares

### Problema
O campo `tamanho` armazena metros lineares (ex: `"5,70"` = 5,70m), não dimensões L×A para cálculo de área. O código atual tenta calcular m² multiplicando largura×altura, mas o correto é somar o valor linear diretamente.

### Alterações

**Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

1. Simplificar `parseTamanho` para apenas converter string numérica (ex: `"5,70"` → `5.70`), sem multiplicar L×A
2. Remover a lógica de `largura * altura` — usar apenas o campo `tamanho` (ou `pedido_linha_tamanho` como fallback)
3. Trocar sufixo de `m²` para `m` na exibição

**Cálculo simplificado:**
```typescript
let tamanho = parseTamanho(item.tamanho);
if (tamanho === 0) {
  tamanho = parseTamanho(item.pedido_linha_tamanho);
}
porEtapa[etapa][nome].tamanhoTotal += tamanho * item.quantidade;
```

Onde `parseTamanho` apenas faz `parseFloat(t.replace(',', '.'))`.

### Arquivos impactados
- `src/pages/administrativo/ProducaoAdminReadOnly.tsx`

