
# Adicionar tags Neo/Pedido e tamanho de porta no modal de instalacoes da meta

## Resumo

Atualizar o modal `InstalacoesDaMetaModal` para:
1. Buscar instalacoes de AMBAS as tabelas (`neo_instalacoes` e `instalacoes`)
2. Exibir badge de origem: "Neo" (verde) ou "Pedido" (azul)
3. Exibir badge de tamanho da porta (P, G, GG) baseado na `metragem_quadrada` da tabela `instalacoes`

## Logica

### Fontes de dados

- **neo_instalacoes**: ja busca hoje. Adicionar campo `_origem: 'neo'`. Nao tem metragem, entao tamanho sera null.
- **instalacoes**: nova busca. Filtrar por `instalacao_concluida = true`, `instalacao_concluida_em` dentro do periodo da meta. Para meta de equipe, filtrar `responsavel_instalacao_id = meta.referencia_id`. Para gerente, todas. Buscar `metragem_quadrada` para classificar tamanho.

### Classificacao de tamanho (mesma logica do ranking)

- P (Pequena): metragem < 25 m2
- G (Grande): 25 - 50 m2
- GG (Extra Grande): > 50 m2

### Meta de gerente

Contabiliza TODAS as instalacoes concluidas no periodo, tanto de `neo_instalacoes` quanto de `instalacoes`.

### Meta de equipe

- `neo_instalacoes`: filtra por `equipe_id`
- `instalacoes`: filtra por `responsavel_instalacao_id = equipe_id` (mesmo padrao do ranking)

## Alteracoes

### Arquivo: `src/components/metas/InstalacoesDaMetaModal.tsx`

- Refatorar a query para buscar de ambas as tabelas em paralelo (Promise.all)
- Da tabela `instalacoes`: buscar `id, nome_cliente, metragem_quadrada, instalacao_concluida_em` com filtros de periodo e `instalacao_concluida = true`, `pedido_id IS NOT NULL`
- Combinar resultados com campo `origem` ('neo' ou 'pedido') e `metragem`
- Ordenar por data decrescente
- Exibir badges:
  - Origem: Badge azul "Pedido" ou verde "Neo"
  - Tamanho: Badge outline "P", "G" ou "GG" (quando metragem disponivel)
- Atualizar contagem de progresso para refletir total combinado

### Nenhum arquivo novo necessario
