
# Plano: Ranking com Instalações de Pedidos + Neo Instalações

## Objetivo

Ajustar o ranking das equipes de instalação para considerar:
1. **Instalações vinculadas a pedidos** (`pedido_id IS NOT NULL`)
2. **Neo Instalações concluídas** por equipes internas

## Dados Atuais no Banco

| Fonte | Total | Concluídas | Por Equipe Interna |
|-------|-------|------------|-------------------|
| instalacoes (com pedido) | a verificar | a verificar | a verificar |
| neo_instalacoes | 51 | 16 | 10 |

## Alteração Técnica

### Arquivo: `src/hooks/useRankingEquipesInstalacao.ts`

**Modificar a função `fetchRanking` para buscar e combinar duas fontes:**

```typescript
// 1. Buscar equipes ativas (já existente)
const equipesMap = new Map(...);

// 2. Buscar instalações vinculadas a pedidos
let queryInstalacoes = supabase
  .from('instalacoes')
  .select('responsavel_instalacao_id, metragem_quadrada, instalacao_concluida_em')
  .eq('instalacao_concluida', true)
  .eq('tipo_instalacao', 'elisa')
  .not('responsavel_instalacao_id', 'is', null)
  .not('pedido_id', 'is', null);  // NOVO FILTRO

// 3. Buscar neo instalações concluídas por equipes internas
let queryNeoInstalacoes = supabase
  .from('neo_instalacoes')
  .select('equipe_id, concluida_em')
  .eq('concluida', true)
  .eq('tipo_responsavel', 'equipe_interna')
  .not('equipe_id', 'is', null);

// 4. Aplicar filtros de período em ambas as queries

// 5. Combinar resultados no agrupamento
```

### Lógica de Combinação

```typescript
const agrupamento = new Map<string, RankingEquipe>();

// Processar instalações de pedidos
(instalacoesData || []).forEach((instalacao) => {
  const equipe = equipesMap.get(instalacao.responsavel_instalacao_id);
  if (!equipe) return;
  
  // Incrementar quantidade e metragem
  item.quantidade_instalacoes += 1;
  item.metragem_total += instalacao.metragem_quadrada || 0;
});

// Processar neo instalações (não têm metragem)
(neoInstalacoesData || []).forEach((neo) => {
  const equipe = equipesMap.get(neo.equipe_id);
  if (!equipe) return;
  
  // Incrementar apenas quantidade (neo instalações não têm metragem)
  item.quantidade_instalacoes += 1;
  // metragem não incrementa
});
```

## Considerações

| Aspecto | Instalações de Pedidos | Neo Instalações |
|---------|----------------------|-----------------|
| Metragem | Sim (soma no total) | Não possui |
| Equipe | `responsavel_instalacao_id` | `equipe_id` |
| Filtro tipo | `tipo_instalacao = 'elisa'` | `tipo_responsavel = 'equipe_interna'` |
| Data conclusão | `instalacao_concluida_em` | `concluida_em` |

## Resultado Esperado

O ranking mostrará o desempenho consolidado das equipes considerando:
- Instalações que passaram pelo fluxo completo de produção (pedidos)
- Serviços avulsos de instalação (neo instalações)

A metragem total refletirá apenas as instalações de pedidos (que possuem esse dado).
