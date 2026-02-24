
# Adicionar aba "Correções" em /producao/carregamento

## Resumo

Adicionar uma quarta aba nas tabs de filtro das duas paginas de carregamento para listar exclusivamente as ordens vindas da tabela `correcoes`.

## Mudancas

### 1. `src/pages/ProducaoCarregamento.tsx`

- Atualizar o tipo `FiltroTipo` para incluir `"correcoes"`
- Adicionar uma 4a TabsTrigger com icone `Wrench`, label "Correções" e contagem `ordens.filter(o => o.fonte === 'correcoes').length`
- Atualizar o grid de `grid-cols-3` para `grid-cols-4`
- Atualizar a logica de filtro para: quando `filtroTipo === "correcoes"`, filtrar por `ordem.fonte === 'correcoes'`

### 2. `src/pages/fabrica/producao/CarregamentoMinimalista.tsx`

- Mesmas mudancas: tipo, tab adicional com `Wrench`, grid 4 colunas, logica de filtro por `fonte === 'correcoes'`

### Arquivos modificados
1. `src/pages/ProducaoCarregamento.tsx`
2. `src/pages/fabrica/producao/CarregamentoMinimalista.tsx`
