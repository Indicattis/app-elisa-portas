

## Plano: Adicionar índice de Custo do Setor

### Onde colocar
Na sidebar esquerda (desktop) e nos chips (mobile), logo abaixo de cada botão de setor, exibir o custo total do setor selecionado. Adicionalmente, um banner/card de resumo no topo da área de conteúdo mostrando o custo total do setor atual.

### Implementação

**`src/pages/direcao/GestaoColaboradoresDirecao.tsx`**

1. Criar função `getSetorCusto(setor)` que soma `custo_colaborador` de todos os usuários do setor (usando os dados já carregados em `allUsers`)

2. **Sidebar desktop** — Abaixo do bloco de botões de setor, adicionar um card com:
   - "Custo do Setor" como label
   - Valor total formatado em R$ (soma dos `custo_colaborador` dos colaboradores do setor selecionado)
   - Quantidade de colaboradores com custo definido vs total

3. **Mobile chips** — Após os chips, exibir uma linha com o custo total do setor selecionado

4. **Topo do conteúdo** — Antes da lista de funções, um pequeno indicador inline mostrando o custo total do setor em destaque

Nenhuma migração SQL necessária — o campo `custo_colaborador` já existe na tabela.

