

# Modal de instalacoes ao clicar na meta

## Resumo

Ao clicar em um MetaCard, abrir um modal listando as instalacoes concluidas que contam para aquela meta (filtradas pelo periodo e, no caso de equipe, pelo equipe_id).

## Alteracoes

### 1. Novo componente: `InstalacoesDaMetaModal`

Arquivo: `src/components/metas/InstalacoesDaMetaModal.tsx`

- Recebe a `MetaInstalacao` como prop, alem de `open` e `onOpenChange`
- Busca instalacoes de `neo_instalacoes` onde `concluida = true` e `concluida_em` dentro do periodo da meta
- Se `meta.tipo === "equipe"`: filtra por `equipe_id = meta.referencia_id`
- Se `meta.tipo === "gerente"`: sem filtro de equipe (todas as instalacoes)
- Exibe lista com: nome do cliente, cidade/estado, data de conclusao, equipe responsavel
- Mostra resumo no topo: total de instalacoes e a meta de portas
- Usa Dialog do Radix com ScrollArea para a lista

### 2. Alterar `MetaCard` em `MetasInstalacoesDirecao.tsx`

- Adicionar estado `modalAberto` no MetaCard
- Tornar o card clicavel com `cursor-pointer` e `onClick` para abrir o modal
- Renderizar `InstalacoesDaMetaModal` dentro do MetaCard

### Arquivos

- `src/components/metas/InstalacoesDaMetaModal.tsx` (novo)
- `src/pages/direcao/MetasInstalacoesDirecao.tsx` (MetaCard atualizado para abrir modal)

