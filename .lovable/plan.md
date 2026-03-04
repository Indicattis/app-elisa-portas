

# Separar Despesas em Duas Colunas: Fixa e Variável

## O que será feito

Reorganizar a página `/direcao/dre/despesas` para exibir as despesas em **duas colunas lado a lado**: uma coluna dedicada às despesas **Fixas** e outra às **Variáveis**, em vez de uma única tabela com todas misturadas.

## Alterações em `DREDespesasDirecao.tsx`

1. **Separar os dados filtrados** em dois arrays: `fixas` e `variaveis` a partir de `filteredTiposCustos`.

2. **Layout em grid de 2 colunas** (`grid grid-cols-1 lg:grid-cols-2 gap-4`), cada uma com:
   - Título/header ("Despesas Fixas" / "Despesas Variáveis") com contagem
   - Tabela própria com as colunas: Nome, Categoria, Limite Mensal, Ações
   - Remover a coluna "Tipo" (já separado visualmente)
   - Total do limite mensal no rodapé de cada tabela

3. **Filtros e busca** permanecem globais no topo, aplicando-se a ambas as colunas.

## Arquivo afetado
- `src/pages/direcao/DREDespesasDirecao.tsx`

