## Plano

### 1. Trazer Ordens de Correção para `/logistica/instalacoes`
- Em `src/hooks/useOrdensInstalacao.ts`, ampliar o filtro para incluir pedidos com `etapa_atual` em `['instalacoes', 'correcoes']` (atualmente filtra só `instalacoes`).
- Acrescentar no objeto retornado um campo derivado `tipo_ordem: 'instalacao' | 'correcao'` baseado em `pedido.etapa_atual`.

### 2. Diferenciar visualmente cada card (mesma grid)
- Em `src/components/instalacoes/OrdemInstalacaoRow.tsx`:
  - Aplicar borda esquerda colorida e badge no topo do card:
    - **Instalação**: borda `border-l-blue-500`, badge azul "Instalação".
    - **Correção**: borda `border-l-purple-500`, badge roxo "Correção".
  - Sem alterar layout/estrutura — apenas cor + badge identificador.
- A contagem no subtítulo do header da página passa a discriminar: "X instalações • Y correções • Z carregadas".

### 3. Mover navegação para o header de todas as páginas filhas e remover o Hub
- Criar componente reutilizável `src/components/instalacoes/InstalacoesHeaderActions.tsx` contendo os 5 botões (Ordens, Equipes, Cronograma, Ranking Equipes, Ranking Autorizados), destacando o ativo conforme a rota corrente.
- Inserir esse componente no header das páginas:
  - `OrdensInstalacoesLogistica.tsx` (substituir botões inline atuais)
  - `EquipesMinimalista.tsx`
  - `CronogramaMinimalista.tsx`
  - `RankingEquipesInstalacao.tsx`
  - `RankingAutorizadosInstalacao.tsx`
- Remover o Hub:
  - Deletar `src/pages/logistica/InstalacoesHub.tsx`.
  - Em `src/App.tsx`, alterar a rota `/logistica/instalacoes` para apontar para `OrdensInstalacoesLogistica` (já aponta) e remover qualquer referência/import ao `InstalacoesHub`.
  - Em `src/pages/logistica/LogisticaHub.tsx`, garantir que o item "Instalações" continue navegando para `/logistica/instalacoes` (que agora é direto a página de Ordens).

### 4. Verificações finais
- Conferir que o botão "Voltar" e breadcrumbs em cada página filha apontam para `/logistica` (não mais para o hub removido).
- Validar contagens, filtros (Equipe/Estado) e busca continuam funcionando com a inclusão das correções.
