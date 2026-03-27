

## Plano: Seção "Ajuste de Pontuação" no Ranking

### Objetivo
Adicionar uma seção colapsável abaixo do ranking que lista todos os pedidos finalizados cujas instalações estão sem equipe atribuída (`responsavel_instalacao_id IS NULL`) ou com `instalacao_concluida = false` (apesar do pedido estar finalizado). O usuário poderá selecionar a equipe responsável para cada um, corrigindo o ranking.

### Funcionamento
- Seção em acordeão "Ajuste de Pontuação" com badge mostrando quantidade de pendências
- Cada item mostra: número do pedido, nome do cliente, data do pedido
- Select/dropdown com as equipes ativas (usando `useResponsaveisInstalacao` — filtrado só equipes internas)
- Ao selecionar a equipe e confirmar, faz UPDATE na `instalacoes` setando `responsavel_instalacao_id`, `responsavel_instalacao_nome`, `instalacao_concluida = true`, `instalacao_concluida_em = now()`
- Após salvar, o item some da lista e o ranking atualiza

### Arquivos

**1. `src/hooks/useAjustePontuacaoInstalacao.ts` (novo)**
- Query: busca `instalacoes` JOIN `pedidos_producao` onde `pedidos_producao.etapa_atual = 'finalizado'` E (`instalacoes.responsavel_instalacao_id IS NULL` OU `instalacoes.instalacao_concluida = false`)
- Retorna lista com `instalacao_id`, `pedido_numero`, `nome_cliente`
- Mutation para atualizar a instalação com equipe e marcar como concluída
- Busca equipes ativas de `equipes_instalacao`

**2. `src/pages/logistica/RankingEquipesInstalacao.tsx`**
- Importar novo hook e adicionar seção acordeão após o ranking
- Cada item: card com info do pedido + select de equipe + botão salvar
- Invalidar query do ranking ao salvar

