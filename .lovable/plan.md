
# Melhorias no Ranking de Equipes de Instalacao

## 1. Estilo visual ouro/prata/bronze

Os cards das 3 primeiras posicoes terao bordas e fundos tematicos:
- **1o lugar (Ouro)**: borda e fundo com tons dourados (`border-yellow-500/30`, `bg-gradient-to-r from-yellow-500/10 to-amber-500/5`)
- **2o lugar (Prata)**: tons prateados (`border-gray-400/30`, `bg-gradient-to-r from-gray-400/10 to-slate-400/5`)
- **3o lugar (Bronze)**: tons bronze (`border-orange-700/30`, `bg-gradient-to-r from-orange-700/10 to-amber-700/5`)
- **Demais**: estilo atual (`bg-white/5 border-white/10`)

A barra de progresso tambem tera cor tematica (dourada, prateada, bronze) para as 3 primeiras posicoes.

## 2. Exibir integrantes das equipes

- Buscar todos os membros de todas as equipes usando o hook `useEquipesMembros` (sem filtro de equipeId, traz todos)
- Filtrar os membros por equipe no render e exibir os avatares compactos abaixo do nome da equipe usando o componente `EquipeMembrosList` ja existente no modo `compact`

## 3. Dialog com lista de instalacoes ao clicar

- Ao clicar em um card de equipe, abrir um `Dialog` mostrando todas as instalacoes concluidas daquela equipe no periodo selecionado
- O hook `useRankingEquipesInstalacao` sera atualizado para retornar tambem os dados individuais das instalacoes (nome do cliente, data de conclusao, metragem, e origem: pedido ou neo)
- A lista no dialog mostrara: nome do cliente, data de conclusao, metragem (quando disponivel), e um badge indicando a origem

## Detalhes tecnicos

### Arquivo: `src/hooks/useRankingEquipesInstalacao.ts`

- Adicionar mais campos no select das queries:
  - `instalacoes`: adicionar `id, nome_cliente` 
  - `neo_instalacoes`: adicionar `id, nome_cliente`
- Criar nova interface `InstalacaoDetalhe` com campos: `id`, `nome_cliente`, `data_conclusao`, `metragem`, `origem` ('pedido' | 'neo')
- Adicionar campo `instalacoes_detalhes: InstalacaoDetalhe[]` na interface `RankingEquipe`
- Ao processar cada instalacao, alem de incrementar contadores, guardar os detalhes individuais no array

### Arquivo: `src/pages/logistica/RankingEquipesInstalacao.tsx`

1. Importar `useEquipesMembros`, `EquipeMembrosList`, `Dialog` e componentes relacionados
2. Adicionar estado `selectedEquipe` para controlar qual equipe foi clicada
3. Criar funcao `getCardStyles(posicao)` que retorna classes CSS de borda/fundo tematicas
4. No render de cada card:
   - Aplicar estilos tematicos via `getCardStyles`
   - Adicionar `cursor-pointer` e `onClick` para abrir o dialog
   - Renderizar `EquipeMembrosList` em modo compact abaixo do nome
5. Adicionar `Dialog` com scroll area listando as instalacoes da equipe selecionada

### Arquivos

1. **Editar**: `src/hooks/useRankingEquipesInstalacao.ts` -- incluir detalhes individuais das instalacoes
2. **Editar**: `src/pages/logistica/RankingEquipesInstalacao.tsx` -- estilos tematicos, membros, dialog de instalacoes
