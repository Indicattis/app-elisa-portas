
# Filtrar ordens de pedidos ja finalizados na expedicao

## Problema
Apos remover o filtro restritivo de `tipo_entrega`, ordens de carregamento cujo pedido ja esta na etapa `finalizado` passaram a aparecer na lista de expedicao. Isso acontece porque esses registros ainda possuem `carregamento_concluido = false` no banco, entao passam pelo filtro da query. O correto e nao exibi-los, pois o pedido ja foi concluido.

## Solucao

### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Adicionar um filtro apos obter `todasOrdens` para excluir registros cujo `pedido.etapa_atual` seja `finalizado` (ou outras etapas pos-conclusao como `correcoes`).

Inserir logo apos a linha `const todasOrdens = ordensCarregamento || [];`:

```typescript
// Excluir ordens cujo pedido já está finalizado
const ordensAtivas = todasOrdens.filter(o => {
  const etapa = o.pedido?.etapa_atual;
  return etapa !== 'finalizado';
});
```

Depois, substituir `todasOrdens` por `ordensAtivas` na logica de deduplicacao por `pedido_id` que vem logo em seguida.

### Impacto
- Ordens de pedidos finalizados deixam de aparecer na expedicao
- Nenhuma alteracao no banco de dados
- A filtragem ocorre no cliente, apos a query existente
