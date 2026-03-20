

## Plano: Corrigir cálculo de Tamanho Total para metros lineares

### Diagnóstico

Dois problemas encontrados:

1. **Fonte de dados errada**: O hook `useItensNaoConcluidosPorEtapa` busca dados de `linhas_ordens`, mas o `tamanho` está preenchido em `pedido_linhas`. Muitas `linhas_ordens` têm `tamanho` nulo, e o fallback via `pedido_linha_id` também retorna nulo (FK não preenchida).

2. **Cálculo errado**: O código atual faz `tamanho × quantidade`. Para meia canas, o `tamanho` é o comprimento de corte (ex: 5,50m = largura da porta), e `quantidade` é o número de peças para aquela porta. O "Tamanho Total" correto é a **soma dos tamanhos** (metros lineares de corte), **sem multiplicar pela quantidade**.

   - Dados verificados no banco: `SUM(tamanho)` para "Meia cana lisa - 0,70mm" em `em_producao` via `pedido_linhas` = ~130m (próximo de 136m, variação por dados em tempo real).
   - `SUM(tamanho × quantidade)` = 3.617m (claramente errado).

### Alterações

**Arquivo: `src/hooks/useItensNaoConcluidosPorEtapa.ts`**
- Alterar a query para buscar de `pedido_linhas` em vez de `linhas_ordens`, trazendo: `tamanho`, `quantidade`, `estoque_id`, `nome_produto` (do estoque), `pedido_id` → `etapa_atual`, `numero_pedido`.
- Filtrar por pedidos que não estejam em etapa `finalizado` ou `arquivo_morto`.

**Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**
- Remover a multiplicação `tamanho × quantidade` no cálculo de `tamanhoTotal`.
- Usar apenas `SUM(tamanho)` — somar o valor do tamanho de cada linha sem multiplicar pela quantidade.

### Resumo do cálculo corrigido
```
// Antes (errado):
tamanhoTotal += parseTamanho(item.tamanho) * item.quantidade;

// Depois (correto):
tamanhoTotal += parseTamanho(item.tamanho);
```

### Arquivos impactados
- `src/hooks/useItensNaoConcluidosPorEtapa.ts`
- `src/pages/administrativo/ProducaoAdminReadOnly.tsx`

