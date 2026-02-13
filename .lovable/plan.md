
# Corrigir instalacoes no cronograma minimalista

## Problema
O hook `useInstalacoesMinhaEquipeCalendario` filtra por `data_instalacao` e `responsavel_instalacao_id`, mas as instalacoes agendadas no calendario usam os campos `data_carregamento` e `responsavel_carregamento_id`. O campo `data_instalacao` esta `null` para esses registros, por isso nao aparecem.

A pagina `/logistica/expedicao` funciona porque o hook `useOrdensCarregamentoCalendario` busca corretamente por `data_carregamento` na tabela `instalacoes`.

## Solucao
Alterar `useInstalacoesMinhaEquipeCalendario.ts` para usar os campos corretos:

### Arquivo: `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
Trocar todos os campos de instalacao pelos campos de carregamento na query:

| Campo atual (errado)           | Campo correto                    |
|-------------------------------|----------------------------------|
| `data_instalacao`             | `data_carregamento`              |
| `responsavel_instalacao_id`   | `responsavel_carregamento_id`    |
| `responsavel_instalacao_nome` | `responsavel_carregamento_nome`  |
| `instalacao_concluida`        | `carregamento_concluido`         |

Ajustes especificos:
- Filtro `.eq("instalacao_concluida", false)` -> `.eq("carregamento_concluido", false)`
- Filtro `.not("data_instalacao", "is", null)` -> `.not("data_carregamento", "is", null)`
- Filtros de range `.gte/.lte("data_instalacao", ...)` -> `.gte/.lte("data_carregamento", ...)`
- Filtros de equipe `.eq("responsavel_instalacao_id", ...)` -> `.eq("responsavel_carregamento_id", ...)`
- Order `.order("data_instalacao", ...)` -> `.order("data_carregamento", ...)`
- No mapeamento, usar `item.data_carregamento`, `item.responsavel_carregamento_id`, `item.responsavel_carregamento_nome`, `item.carregamento_concluido` diretamente
- No `equipesMap.get`, usar `item.responsavel_carregamento_id`

### Arquivo editado
- `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
