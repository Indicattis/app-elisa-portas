
# Correção: Erro de Foreign Key no Ranking de Equipes

## Problema

A query Supabase está tentando usar um relacionamento de foreign key que não existe:

```typescript
equipe:equipes_instalacao!instalacoes_responsavel_instalacao_id_fkey (...)
```

O campo `responsavel_instalacao_id` na tabela `instalacoes` não possui uma foreign key formal para `equipes_instalacao`.

## Solução

Modificar a abordagem para buscar os dados em duas etapas:
1. Buscar as instalações concluídas
2. Buscar as equipes separadamente e fazer o join na aplicação

## Alteração Técnica

### Arquivo: `src/hooks/useRankingEquipesInstalacao.ts`

**Substituir a query com join por duas queries separadas:**

```typescript
// ANTES (linha 40-52):
let query = supabase
  .from('instalacoes')
  .select(`
    responsavel_instalacao_id,
    metragem_quadrada,
    instalacao_concluida_em,
    equipe:equipes_instalacao!instalacoes_responsavel_instalacao_id_fkey (
      id, nome, cor, ativa
    )
  `)
  ...

// DEPOIS:
// 1. Buscar todas as equipes ativas primeiro
const { data: equipesData, error: equipesError } = await supabase
  .from('equipes_instalacao')
  .select('id, nome, cor, ativa')
  .eq('ativa', true);

if (equipesError) throw equipesError;

// Criar mapa de equipes para lookup rápido
const equipesMap = new Map(
  (equipesData || []).map(eq => [eq.id, eq])
);

// 2. Buscar instalações concluídas
let query = supabase
  .from('instalacoes')
  .select(`
    responsavel_instalacao_id,
    metragem_quadrada,
    instalacao_concluida_em,
    tipo_instalacao
  `)
  .eq('instalacao_concluida', true)
  .eq('tipo_instalacao', 'elisa')  // Apenas equipes internas
  .not('responsavel_instalacao_id', 'is', null);

// 3. No processamento, usar o mapa de equipes
(data || []).forEach((instalacao: any) => {
  const equipe = equipesMap.get(instalacao.responsavel_instalacao_id);
  if (!equipe) return;  // Equipe não encontrada ou inativa
  
  // ... resto do agrupamento
});
```

## Benefícios

1. Elimina a dependência de foreign key inexistente
2. Query mais eficiente (busca equipes uma vez só)
3. Filtra corretamente apenas equipes internas (`tipo_instalacao = 'elisa'`)

## Resultado Esperado

A página `/logistica/instalacoes/ranking` carregará corretamente mostrando o ranking das equipes de instalação baseado nas instalações concluídas.
