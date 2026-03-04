

# Fix: "Carregada" sem data na etapa Correções

## Diagnóstico

O pedido #0200 (ff552e4d) está na etapa `correcoes`. O card mostra "Carregada" sem data porque:

1. A query busca 3 fontes em paralelo: `ordens_carregamento`, `instalacoes` e `correcoes`
2. A variavel `concluido` usa `todasFontes.some(f => f.carregamento_concluido)` — retorna `true` porque a `ordens_carregamento` antiga (da entrega original) tem `carregamento_concluido = true`
3. Porém, a `fontePrioritaria` para a etapa `correcoes` é `corrRes.data?.[0]`, que tem `data_carregamento = null` (a correção ainda nem foi agendada)

Resultado: mostra "Carregada" (do flag antigo) mas sem data (pois a correção não tem data).

## Correção

Em `src/components/pedidos/PedidoCard.tsx` (linhas 440-453), o `concluido` deve respeitar a fonte prioritária da etapa atual, não qualquer fonte:

```typescript
// ANTES (errado - usa qualquer fonte)
const concluido = todasFontes.some(f => f.carregamento_concluido);

// DEPOIS (correto - priorizar fonte da etapa)
const fontePrioritaria = fontePorEtapa[pedido.etapa_atual] 
  || todasFontes.find(f => f.carregamento_concluido) 
  || todasFontes[0];
const concluido = fontePrioritaria?.carregamento_concluido || false;
```

Isso garante que na etapa `correcoes`, o status de carregamento venha da tabela `correcoes` (que é `false`), e não da `ordens_carregamento` antiga.

## Arquivo afetado
- `src/components/pedidos/PedidoCard.tsx` (linha 441)

