
# Habilitar visualizacao completa do cronograma para gerentes e administradores

## Objetivo
Permitir que usuarios com role `administrador`, `gerente_fabril`, `gerente_instalacoes`, `diretor` ou com `bypass_permissions` vejam o cronograma completo de todas as equipes em `/logistica/instalacoes/cronograma`, em vez de apenas a sua equipe.

## Solucao

Modificar os dois hooks de dados (`useInstalacoesMinhaEquipeCalendario` e `useNeoInstalacoesMinhaEquipe`) para aceitar um parametro `verTodas` que remove o filtro por equipe. Na pagina `CronogramaMinimalista`, detectar se o usuario e admin/gerente e passar esse parametro.

## Detalhes tecnicos

### 1. `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`

- Adicionar parametro opcional `verTodas: boolean`
- Quando `verTodas === true`, pular a busca de equipe do usuario e buscar TODAS as ordens de carregamento no periodo (sem filtro `responsavel_carregamento_id`)
- Buscar tambem todas as equipes ativas para mapear cores (`_corEquipe`) por `responsavel_carregamento_id`
- Retornar `temEquipe: true` quando `verTodas` for true

### 2. `src/hooks/useNeoInstalacoesMinhaEquipe.ts`

- Adicionar parametro opcional `verTodas: boolean`
- Quando `verTodas === true`, buscar TODAS as neo instalacoes no periodo (sem filtro `equipe_id`)
- Incluir join com `equipes_instalacao` para trazer nome e cor da equipe de cada item

### 3. `src/pages/logistica/CronogramaMinimalista.tsx`

- Importar `useAuth` e extrair `isAdmin`, `userRole`, `hasBypassPermissions`
- Calcular `isGerente` verificando se o role e `administrador`, `gerente_fabril`, `gerente_instalacoes`, `diretor` ou se tem `bypass_permissions`
- Passar `verTodas={isGerente}` para ambos os hooks
- Quando `isGerente`, nao exibir a mensagem "Sem equipe vinculada" (pois vera todas)
- Atualizar o titulo/badge do header para mostrar "Todas as equipes" quando `isGerente` em vez do nome de uma equipe especifica

### Arquivos editados
1. `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
2. `src/hooks/useNeoInstalacoesMinhaEquipe.ts`
3. `src/pages/logistica/CronogramaMinimalista.tsx`
