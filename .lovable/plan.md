
# Plano: Corrigir Filtro de Ordens Concluídas no Calendário de Expedição

## Problema Identificado

Pedidos de entrega que tiveram sua ordem de carregamento concluída não estão desaparecendo do calendário em `/logistica/expedicao`.

**Causa raiz**: O hook `useOrdensCarregamentoCalendario.ts` não filtra corretamente as ordens concluídas. A query busca todas as ordens no período e depois filtra apenas por `status !== 'concluida'`, mas algumas ordens concluídas têm status diferente (ex: `'carregada'`).

## Evidência do Problema

Ordem encontrada no banco que aparece indevidamente no calendário:

| Campo | Valor |
|-------|-------|
| nome_cliente | GUSTAVO OLIVEIRA DE LIMA |
| carregamento_concluido | **true** |
| status | carregada |
| etapa_atual | finalizado |
| data_carregamento | 2026-01-27 |

O filtro atual `status !== 'concluida'` não remove esta ordem porque o status é `'carregada'`, não `'concluida'`.

---

## Solução

Adicionar filtro direto na query do Supabase para excluir ordens com `carregamento_concluido = true`.

**Arquivo**: `src/hooks/useOrdensCarregamentoCalendario.ts`

### Alteração na Query

Adicionar `.eq("carregamento_concluido", false)` na query de `ordens_carregamento` (por volta da linha 74):

```typescript
// Antes
.gte("data_carregamento", inicio)
.lte("data_carregamento", fim)
.order("data_carregamento", { ascending: true });

// Depois
.gte("data_carregamento", inicio)
.lte("data_carregamento", fim)
.eq("carregamento_concluido", false) // Excluir ordens já concluídas
.order("data_carregamento", { ascending: true });
```

### Remover Filtro JavaScript Redundante

Como o filtro agora é feito na query, podemos simplificar o código removendo o filtro JavaScript desnecessário (linha 206):

```typescript
// Antes
const filteredOrdens = ordensComFonte.filter((ordem: any) => ordem.status !== 'concluida');
const filteredInstalacoes = instalacoesNormalizadas.filter((inst: any) => inst.status !== 'concluida');

return [...filteredOrdens, ...filteredInstalacoes] as OrdemCarregamento[];

// Depois
return [...ordensComFonte, ...instalacoesNormalizadas] as OrdemCarregamento[];
```

---

## Correção de Dados Existentes

Corrigir ordens que têm `carregamento_concluido = true` mas `status` diferente de `'concluida'`:

```sql
UPDATE ordens_carregamento 
SET status = 'concluida'
WHERE carregamento_concluido = true 
  AND status != 'concluida';
```

---

## Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Adicionar filtro `.eq("carregamento_concluido", false)` na query |
| Banco de dados | Corrigir status inconsistente de ordens já concluídas |

---

## Resultado Esperado

Após a implementação:
1. Ordens de carregamento com `carregamento_concluido = true` não aparecerão mais no calendário
2. Pedidos tipo "entrega" avançam automaticamente para "Finalizado" quando o carregamento é concluído (já funciona via RPC)
3. O calendário mostra apenas ordens pendentes de carregamento
