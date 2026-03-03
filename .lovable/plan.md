

# Refatorar ranking de desempenho para usar `pontuacao_colaboradores`

## Resumo
Substituir a RPC `get_desempenho_etapas` por uma query direta na tabela `pontuacao_colaboradores`, que ja registra a pontuacao real de cada colaborador ao concluir ordens. Isso alinha o ranking com o mesmo sistema usado nas metas.

## Alteracoes

### `src/hooks/useDesempenhoEtapas.ts`

Reescrever a `queryFn` para consultar `pontuacao_colaboradores` com join em `admin_users` para nome e foto:

1. Buscar todos registros de `pontuacao_colaboradores` onde `created_at` esta entre `dataInicio` e `dataFim`
2. Fazer join com `admin_users` via `user_id` para obter `nome` e `foto_perfil_url`
3. Agrupar no JS por `user_id`, somando:
   - `perfiladas_metros`: soma de `metragem_linear` onde `tipo_ranking = 'perfiladeira'`
   - `soldadas`: contagem de registros onde `tipo_ranking = 'solda'`
   - `soldadas_p`: contagem onde `porta_soldada = 'P'`
   - `soldadas_g`: contagem onde `porta_soldada = 'G'` (ou `'GG'`)
   - `separadas`: soma de `pedido_separado` onde `tipo_ranking = 'separacao'`
   - `pintura_m2`: soma de `metragem_quadrada_pintada` onde `tipo_ranking = 'pintura'`
   - `carregamentos`: manter em 0 (nao ha tipo_ranking de carregamento na tabela)

A query sera:
```
supabase
  .from("pontuacao_colaboradores")
  .select("user_id, tipo_ranking, metragem_linear, porta_soldada, pedido_separado, metragem_quadrada_pintada, created_at, user:admin_users!user_id(nome, foto_perfil_url)")
  .gte("created_at", dataInicio + "T00:00:00")
  .lte("created_at", dataFim + "T23:59:59")
```

A interface `DesempenhoColaborador` permanece inalterada. O campo `carregamentos` continuara vindo da fonte atual (tabela `instalacoes`) ou ficara zerado — a decidir se o usuario quer manter carregamentos no ranking.

### Nota sobre carregamentos
A tabela `pontuacao_colaboradores` nao tem `tipo_ranking = 'carregamento'`. Duas opcoes:
- Manter uma consulta separada em `instalacoes` so para carregamentos (como faz a RPC atual)
- Remover carregamentos do ranking baseado em pontuacao

Vou manter a consulta separada para carregamentos para nao perder essa informacao.

