
# Fix: Filtro de Autorizados no Cronograma

## Problema
O estado `autorizadoIdFiltro` e criado e atualizado pelo Select, mas nunca e passado para os 3 hooks de dados (`useInstalacoesMinhaEquipeCalendario`, `useNeoInstalacoesMinhaEquipe`, `useNeoCorrecoesMinhaEquipe`). Por isso, selecionar um autorizado nao altera os dados exibidos.

## Alteracoes

### 1. Hook: `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
- Adicionar parametro `autorizadoIdFiltro?: string | null` na assinatura (linha 11)
- Adicionar `autorizadoIdFiltro` na queryKey (linha 97)
- Na query, quando `autorizadoIdFiltro` estiver definido, filtrar por `.eq("responsavel_carregamento_id", autorizadoIdFiltro)` (apos linha 122)

### 2. Hook: `src/hooks/useNeoInstalacoesMinhaEquipe.ts`
- Adicionar parametro `autorizadoIdFiltro?: string | null` na assinatura (linha 11)
- Adicionar `autorizadoIdFiltro` na queryKey (linha 79)
- Na query, quando `autorizadoIdFiltro` estiver definido, filtrar por `.eq("autorizado_id", autorizadoIdFiltro)` (apos linha 91)

### 3. Hook: `src/hooks/useNeoCorrecoesMinhaEquipe.ts`
- Adicionar parametro `autorizadoIdFiltro?: string | null` na assinatura (linha 11)
- Adicionar `autorizadoIdFiltro` na queryKey (linha 69)
- Na query, quando `autorizadoIdFiltro` estiver definido, filtrar por `.eq("autorizado_id", autorizadoIdFiltro)` (apos linha 81)

### 4. Pagina: `src/pages/logistica/CronogramaMinimalista.tsx`
- Passar `autorizadoIdFiltro` como 5o argumento nos 3 hooks (linhas 66, 72, 78):
  - `useInstalacoesMinhaEquipeCalendario(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro)`
  - `useNeoInstalacoesMinhaEquipe(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro)`
  - `useNeoCorrecoesMinhaEquipe(currentDate, viewType, isGerente, equipeIdFiltro, autorizadoIdFiltro)`

## Logica de filtro
Quando `autorizadoIdFiltro` esta definido, ele tem prioridade sobre o filtro de equipe, pois autorizados sao entidades diferentes de equipes internas. Os dois filtros operam de forma exclusiva: ao selecionar um autorizado, os dados sao filtrados pelo ID do autorizado; ao selecionar uma equipe, sao filtrados pelo ID da equipe.
