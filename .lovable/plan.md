
# Plano: Ranking de Equipes de Instalação

## Objetivo
Criar uma nova página em `/logistica/instalacoes/ranking` que exiba um ranking das equipes de instalação baseado nas ordens de instalação concluídas.

## Estrutura de Arquivos

```text
src/
├── hooks/
│   └── useRankingEquipesInstalacao.ts  (NOVO)
├── pages/
│   └── logistica/
│       └── RankingEquipesInstalacao.tsx  (NOVO)
```

## Alterações Necessárias

### 1. Criar Hook: `useRankingEquipesInstalacao.ts`

Consulta que agrupa instalações concluídas por equipe:

- Buscar todas as instalações onde `instalacao_concluida = true`
- Agrupar por `responsavel_instalacao_id`
- Fazer join com `equipes_instalacao` para nome e cor
- Calcular métricas: quantidade de instalações, metragem total (se disponível)
- Filtro por período (mês atual, ano, todo período)

Interface do ranking:
```typescript
interface RankingEquipe {
  equipe_id: string;
  equipe_nome: string;
  equipe_cor: string | null;
  quantidade_instalacoes: number;
  metragem_total: number;
  ultima_instalacao: string | null;
}
```

### 2. Criar Página: `RankingEquipesInstalacao.tsx`

Layout seguindo o padrão existente (`EquipesMinimalista.tsx`):
- Usar `MinimalistLayout` com breadcrumbs
- Filtros por período (Mês Atual, Este Ano, Todo Período)
- Cards ou tabela com ranking das equipes
- Mostrar posição (medalhas para top 3), nome da equipe, cor, quantidade de instalações
- Barra de progresso visual comparando com a equipe líder

### 3. Atualizar `InstalacoesHub.tsx`

Adicionar novo item no menu:
```typescript
{
  label: "Ranking Equipes",
  icon: Trophy,
  path: "/logistica/instalacoes/ranking",
}
```

### 4. Atualizar `App.tsx`

Adicionar rota:
```typescript
<Route 
  path="/logistica/instalacoes/ranking" 
  element={
    <ProtectedRoute routeKey="logistica_hub">
      <RankingEquipesInstalacao />
    </ProtectedRoute>
  } 
/>
```

## Detalhes Técnicos

### Query do Ranking

```sql
-- Conceito da consulta
SELECT 
  i.responsavel_instalacao_id,
  e.nome as equipe_nome,
  e.cor as equipe_cor,
  COUNT(*) as quantidade_instalacoes,
  SUM(COALESCE(i.metragem_quadrada, 0)) as metragem_total,
  MAX(i.instalacao_concluida_em) as ultima_instalacao
FROM instalacoes i
JOIN equipes_instalacao e ON e.id = i.responsavel_instalacao_id
WHERE i.instalacao_concluida = true
  AND e.ativa = true
  -- Filtro de período opcional
GROUP BY i.responsavel_instalacao_id, e.nome, e.cor
ORDER BY quantidade_instalacoes DESC
```

### Componentes UI

- Cards com a cor da equipe como borda/destaque
- Medalhas para posições 1, 2 e 3
- Barra de progresso proporcional ao líder
- Badge com quantidade de instalações
- Data da última instalação concluída

## Resultado Esperado

Uma página de ranking mostrando as equipes ordenadas por quantidade de instalações concluídas, com visual similar ao ranking de vendedores existente, permitindo filtrar por diferentes períodos.
