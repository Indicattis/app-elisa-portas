
# Cronograma: Filtrar apenas instalacoes, adicionar neo correcoes, filtro de equipes e PDF

## Objetivo
1. Remover entregas do cronograma -- exibir apenas instalacoes (ordens com `tipo_entrega = 'instalacao'`)
2. Adicionar neo correcoes ao calendario (atualmente so mostra neo instalacoes)
3. Adicionar filtro por equipe no header
4. Adicionar botao para baixar PDF filtrado

## Detalhes tecnicos

### 1. `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
- Adicionar filtro na query de `ordens_carregamento` para buscar apenas registros cuja venda tenha `tipo_entrega = 'instalacao'` (usar inner join filtering ou filtrar no client side apos o fetch)
- Como o join com `vendas` ja existe e inclui `tipo_entrega`, filtrar no resultado: `data.filter(item => item.venda?.tipo_entrega === 'instalacao')`
- Adicionar parametro opcional `equipeIdFiltro?: string | null` para filtrar por equipe especifica (quando gerente seleciona uma equipe no filtro)

### 2. Criar `src/hooks/useNeoCorrecoesMinhaEquipe.ts`
- Novo hook similar a `useNeoInstalacoesMinhaEquipe.ts` mas para `neo_correcoes`
- Aceita `verTodas`, `equipeIdFiltro` opcionais
- Busca de `neo_correcoes` com join em `equipes_instalacao` para cores
- Filtra por `data_correcao` no periodo e `concluida = false`

### 3. `src/pages/logistica/CronogramaMinimalista.tsx`
- Importar e usar o novo hook `useNeoCorrecoesMinhaEquipe`
- Adicionar state `equipeIdFiltro` para o filtro de equipes
- Buscar lista de equipes ativas com query simples
- Adicionar no header um `Select` dropdown com as equipes (apenas para gerentes, ja que usuarios normais so veem sua propria equipe)
- Passar `neoCorrecoes` para os componentes do calendario (`CalendarioSemanalExpedicaoDesktop`, `CalendarioSemanalExpedicaoMobile`, `CalendarioMensalExpedicaoDesktop`)
- Filtrar `ordens` e `neoInstalacoes` pelo `equipeIdFiltro` no client side quando selecionado
- Adicionar botao de download PDF no header (icone de download)
- Ao clicar, gerar PDF com os dados filtrados usando uma funcao adaptada

### 4. Criar `src/utils/cronogramaMinimalistaPDF.ts`
- Funcao `gerarCronogramaMinimalistaPDF` que recebe:
  - ordens filtradas (apenas instalacoes)
  - neo instalacoes filtradas
  - neo correcoes filtradas
  - periodo (inicio/fim)
  - equipe selecionada (ou "Todas")
- Layout similar ao `cronogramaPDFGenerator.ts` existente mas adaptado:
  - Titulo: "CRONOGRAMA DE INSTALACOES"
  - Tabela semanal agrupada por dia com secoes para: Instalacoes, Neo Instalacoes, Neo Correcoes
  - Legenda com cores das equipes
  - Resumo estatistico

### 5. Ajuste nos parametros dos hooks
- `useInstalacoesMinhaEquipeCalendario`: adicionar `equipeIdFiltro?: string | null`
  - Quando `equipeIdFiltro` estiver preenchido, usar esse ID no filtro `responsavel_carregamento_id` em vez do ID da equipe do usuario
- `useNeoInstalacoesMinhaEquipe`: adicionar `equipeIdFiltro?: string | null`
  - Quando preenchido, filtrar por `equipe_id = equipeIdFiltro`

### Arquivos editados
1. `src/hooks/useInstalacoesMinhaEquipeCalendario.ts` -- filtrar tipo_entrega + parametro equipeIdFiltro
2. `src/hooks/useNeoInstalacoesMinhaEquipe.ts` -- parametro equipeIdFiltro
3. `src/hooks/useNeoCorrecoesMinhaEquipe.ts` -- novo hook
4. `src/pages/logistica/CronogramaMinimalista.tsx` -- filtro equipes, neo correcoes, botao PDF
5. `src/utils/cronogramaMinimalistaPDF.ts` -- novo gerador de PDF
