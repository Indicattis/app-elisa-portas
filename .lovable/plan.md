

## Plano: Ranking de Autorizados em /logistica/instalacoes

### O que será feito
Adicionar um novo item "Ranking Autorizados" no hub de instalações (`InstalacoesHub.tsx`) e criar uma nova página com ranking de parceiros autorizados, seguindo o mesmo padrão visual do ranking de equipes existente.

### Fontes de dados
- **`neo_instalacoes`**: instalações avulsas feitas por autorizados (`tipo_responsavel = 'autorizado'`, usando `autorizado_id` e `autorizado_nome`)
- **`instalacoes`**: instalações de pedidos feitas por autorizados (via `responsavel_instalacao_id` cruzando com tabela `autorizados`)

### Alterações

**1. Novo hook: `src/hooks/useRankingAutorizadosInstalacao.ts`**
- Mesmo padrão do `useRankingEquipesInstalacao.ts`: filtro por período (mês/ano/todos), agrupamento por autorizado, contagem de instalações, metragem total, detalhes
- Busca `autorizados` ativos, depois cruza com `instalacoes` (concluídas, onde `responsavel_instalacao_id` é um autorizado) e `neo_instalacoes` (concluídas, `tipo_responsavel = 'autorizado'`)

**2. Nova página: `src/pages/logistica/RankingAutorizadosInstalacao.tsx`**
- Cópia adaptada do `RankingEquipesInstalacao.tsx`
- Mesmos componentes visuais: filtros de período, cards com medalhas, barra de progresso, dialog de detalhes
- Sem seção de ajuste de pontuação e sem membros de equipe
- Breadcrumb: Home > Logística > Instalações > Ranking Autorizados

**3. Atualizar `src/pages/logistica/InstalacoesHub.tsx`**
- Adicionar item "Ranking Autorizados" com ícone `Award` e path `/logistica/instalacoes/ranking-autorizados`

**4. Atualizar `src/App.tsx`**
- Adicionar rota `/logistica/instalacoes/ranking-autorizados` apontando para a nova página

