

# Corrigir duplicatas de ordens do mesmo pedido na expedicao

## Problema
Apos remover o filtro restritivo de `tipo_entrega === 'entrega'`, pedidos que possuem multiplos registros na tabela `ordens_carregamento` (mesmo `pedido_id`) passaram a aparecer duplicados na lista de expedicao. Exemplo: pedido 0162 tem 6 registros em `ordens_carregamento`.

A deduplicacao atual so remove duplicatas **entre tabelas** (ordens_carregamento vs instalacoes), mas nao **dentro** da propria tabela `ordens_carregamento`.

## Solucao

### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Adicionar uma etapa de deduplicacao por `pedido_id` dentro de `todasOrdens` **antes** da deduplicacao cruzada com instalacoes.

Logica:
1. Apos obter `todasOrdens`, agrupar por `pedido_id` e manter apenas um registro por pedido (o mais recente por `created_at`, ou o que ja tem data de carregamento agendada)
2. Registros sem `pedido_id` (null) sao mantidos sem deduplicacao
3. A deduplicacao cruzada com instalacoes continua funcionando normalmente apos essa etapa

### Detalhes tecnicos

Inserir entre as linhas que definem `todasOrdens` e `atendenteIds`:

```typescript
// Deduplicar por pedido_id dentro de ordens_carregamento
// Manter o registro mais relevante (com data agendada, ou o mais recente)
const ordensUnicasPorPedido = (() => {
  const semPedido = todasOrdens.filter(o => !o.pedido_id);
  const comPedido = todasOrdens.filter(o => o.pedido_id);
  const porPedido = new Map<string, typeof comPedido[0]>();
  for (const ordem of comPedido) {
    const existing = porPedido.get(ordem.pedido_id!);
    if (!existing) {
      porPedido.set(ordem.pedido_id!, ordem);
    } else {
      // Preferir o que tem data_carregamento, senao o mais recente
      const ordemTemData = !!ordem.data_carregamento;
      const existingTemData = !!existing.data_carregamento;
      if (ordemTemData && !existingTemData) {
        porPedido.set(ordem.pedido_id!, ordem);
      } else if (!ordemTemData && existingTemData) {
        // manter existing
      } else if (new Date(ordem.created_at || 0) > new Date(existing.created_at || 0)) {
        porPedido.set(ordem.pedido_id!, ordem);
      }
    }
  }
  return [...semPedido, ...porPedido.values()];
})();
```

Depois, substituir `todasOrdens` por `ordensUnicasPorPedido` nas referencias subsequentes (atendenteIds e deduplicacao cruzada).

### Arquivo afetado
- `src/hooks/useOrdensCarregamentoUnificadas.ts`
