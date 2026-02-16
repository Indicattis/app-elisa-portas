

# Exibir contagem de agendamentos no tooltip da data de carregamento

## Resumo
Adicionar uma coluna `vezes_agendado` em cada tabela relevante e criar triggers no banco para incrementar automaticamente esse contador sempre que a data de agendamento for definida ou alterada. No front-end, exibir essa contagem no tooltip ao passar o mouse sobre a data de carregamento/agendamento.

## Mudancas no Banco de Dados

### Migration SQL
Adicionar coluna `vezes_agendado` (integer, default 0) nas 4 tabelas:
- `ordens_carregamento`
- `instalacoes`
- `neo_instalacoes`
- `neo_correcoes`

Criar uma trigger function que incrementa `vezes_agendado` quando o campo de data muda de NULL para um valor, ou muda de um valor para outro valor diferente:

- **ordens_carregamento**: monitora `data_carregamento`
- **instalacoes**: monitora `data_carregamento` (fonte de verdade para agendamento)
- **neo_instalacoes**: monitora `data_instalacao`
- **neo_correcoes**: monitora `data_correcao`

A trigger nao incrementa quando a data e removida (set para NULL), apenas quando e definida ou alterada.

## Mudancas no Front-end

### 1. `src/components/pedidos/PedidoCard.tsx`
- Na query `pedido-carregamento` (linha ~332), incluir `vezes_agendado` no select tanto de `instalacoes` quanto de `ordens_carregamento`
- Retornar `vezesAgendado` no objeto de resultado
- Na Col 6 (Data de Carregamento, linha ~1217), envolver o bloco existente com um `Tooltip` que mostra "Agendado X vez(es)" ao passar o mouse

### 2. `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
- Buscar `vezes_agendado` do tipo `NeoInstalacao` (garantir que o hook ja retorna esse campo)
- Na Col 8 (Data de Agendamento, linha ~156), envolver com `Tooltip` mostrando a contagem

### 3. `src/components/pedidos/NeoCorrecaoCardGestao.tsx`
- Mesmo padrao: envolver a Col 8 (Data de Agendamento, linha ~140) com `Tooltip` mostrando a contagem

### 4. Tipos (`src/types/neoInstalacao.ts` e `src/types/neoCorrecao.ts`)
- Adicionar campo `vezes_agendado: number` aos tipos

### 5. Hooks de dados
- Garantir que os hooks `useNeoInstalacoes` e `useNeoCorrecoes` incluem `vezes_agendado` nos selects

## Formato do Tooltip
Ao passar o mouse sobre a data de carregamento/agendamento:
- Se `vezes_agendado` <= 1: nao exibir nada extra (primeira vez e o padrao)
- Se `vezes_agendado` >= 2: exibir "Reagendado X vezes" em texto pequeno dentro do tooltip

## Arquivos envolvidos
- Nova migration SQL (coluna + triggers)
- `src/components/pedidos/PedidoCard.tsx`
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx`
- `src/types/neoInstalacao.ts`
- `src/types/neoCorrecao.ts`
- `src/hooks/useNeoInstalacoes.ts`
- `src/hooks/useNeoCorrecoes.ts`
