
# Plano: Corrigir Exibicao de Ordens de Pintura

## Diagnostico

A query para `ordens_pintura` no hook `useOrdensPorPedido.ts` falha silenciosamente porque tenta selecionar a coluna `tempo_acumulado_segundos` que **nao existe** na tabela.

### Colunas disponiveis em `ordens_pintura`:
- id, pedido_id, numero_ordem, status, responsavel_id
- capturada_em, tempo_conclusao_segundos
- metragem_quadrada, cor_principal, tipo_tinta, etc.

### Coluna que NAO existe:
- `tempo_acumulado_segundos` (existe apenas em ordens_soldagem, ordens_perfiladeira, ordens_separacao)

## Correcao Necessaria

### Modificar `src/hooks/useOrdensPorPedido.ts`

**Linha 160-162 - Remover coluna inexistente:**

```typescript
// ANTES
supabase
  .from('ordens_pintura')
  .select('id, pedido_id, numero_ordem, status, responsavel_id, metragem_quadrada, capturada_em, tempo_acumulado_segundos, tempo_conclusao_segundos')
  .in('pedido_id', pedidoIds),

// DEPOIS
supabase
  .from('ordens_pintura')
  .select('id, pedido_id, numero_ordem, status, responsavel_id, metragem_quadrada, capturada_em, tempo_conclusao_segundos')
  .in('pedido_id', pedidoIds),
```

## Arquivos a Modificar

| Arquivo | Linha | Acao |
|---------|-------|------|
| `src/hooks/useOrdensPorPedido.ts` | 161 | Remover `tempo_acumulado_segundos` da query |

## Resultado Esperado

Apos a correcao, as ordens de pintura aparecerao corretamente em `/fabrica/ordens-pedidos`, especialmente na aba "Aguardando Pintura" onde existem 14 ordens pendentes.
