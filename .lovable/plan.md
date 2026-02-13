
# Corrigir exibicao de instalacoes no cronograma minimalista

## Problema
O cronograma em `/logistica/instalacoes/cronograma` usa o hook `useInstalacoesMinhaEquipeCalendario` que busca dados da tabela `ordens_carregamento`. Porem, as instalacoes regulares (nao-neo) estao armazenadas na tabela `instalacoes`, que e a fonte de verdade. Por isso, elas nao aparecem.

## Solucao
Criar um novo hook ou adaptar a logica para buscar instalacoes da tabela `instalacoes` (igual ao `useOrdensInstalacaoCalendario` faz), aplicando os filtros de equipe e periodo, e passar esses dados para o calendario.

## Detalhes tecnicos

### 1. `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
Alterar a query principal para buscar da tabela `instalacoes` em vez de `ordens_carregamento`:
- Trocar `from("ordens_carregamento")` por `from("instalacoes")`
- Ajustar os campos de filtro:
  - `data_carregamento` -> `data_instalacao`
  - `responsavel_carregamento_id` -> `responsavel_instalacao_id`
  - `status !== 'concluida'` -> `instalacao_concluida = false`
- Remover o filtro client-side de `tipo_entrega === 'instalacao'` (ja nao e necessario pois a tabela `instalacoes` so contem instalacoes)
- Ajustar o join com `vendas` para usar os campos corretos
- Mapear o resultado para o tipo `OrdemCarregamento` mantendo compatibilidade com os componentes do calendario

### 2. Mapeamento de campos
Os componentes do calendario esperam o tipo `OrdemCarregamento`. O mapeamento dos campos da tabela `instalacoes` sera:
- `data_carregamento` <- `data_instalacao`
- `responsavel_carregamento_id` <- `responsavel_instalacao_id`
- `responsavel_carregamento_nome` <- `responsavel_instalacao_nome`
- `cliente_nome` <- `nome_cliente` ou `venda.cliente_nome`
- `status` <- derivado de `instalacao_concluida`
- `_corEquipe` <- mapeado via `equipes_instalacao`

### Arquivo editado
- `src/hooks/useInstalacoesMinhaEquipeCalendario.ts`
