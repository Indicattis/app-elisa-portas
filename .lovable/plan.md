

# Incluir correções no hook de ordens de carregamento unificadas

## Problema

O hook `useOrdensCarregamentoUnificadas` busca dados de `ordens_carregamento` e `instalacoes`, mas ignora completamente a tabela `correcoes`. Pedidos na etapa "correcoes" que possuem carregamento pendente nessa tabela nao aparecem em `/producao/carregamento`.

Atualmente existem 4 registros em `correcoes` com `carregamento_concluido = false` que estao invisiveis.

## Mudancas

### 1. `src/hooks/useOrdensCarregamentoUnificadas.ts`

**Adicionar query de correcoes** (entre a query de instalacoes e a deduplicacao):
- Buscar da tabela `correcoes` com `carregamento_concluido = false` e `concluida = false`
- Join com `vendas` e `pedidos_producao` (mesmo padrao das outras queries)
- Filtrar por `pedido.etapa_atual === 'correcoes'`
- Deduplicar por `pedido_id` (mesmo padrao das instalacoes)

**Incluir correcoes na deduplicacao geral:**
- Criar set `todosIdsCorrecoes` para evitar que `ordens_carregamento` ou orfaos dupliquem pedidos que ja estao em correcoes
- Filtrar `ordensDeduplicadas` para excluir pedidos que existem em correcoes

**Normalizar correcoes para `OrdemCarregamentoUnificada`:**
- Nova fonte: `'correcoes'` (adicionar ao tipo `fonte`)
- Mapear campos: `data_carregamento`, `hora_carregamento`, `tipo_carregamento`, `responsavel_carregamento_id/nome`, etc.
- `tipo_entrega` sera determinado pela venda (como nas outras)

**Atualizar `concluirCarregamentoMutation`:**
- Adicionar branch `else if (ordem.fonte === 'correcoes')`:
  - Atualizar `observacoes` e `foto_carregamento_url` se fornecidos
  - Marcar `carregamento_concluido = true`, `carregamento_concluido_em = now()`
  - Avancar o pedido para `finalizado` (fechar etapa, atualizar `pedidos_producao`, registrar movimentacao)
  - Usar queries diretas no Supabase (nao existe RPC dedicada para correcoes)

**Adicionar subscription da tabela `correcoes`:**
- Novo canal realtime para invalidar cache quando `correcoes` mudar

### 2. Interface `OrdemCarregamentoUnificada`

- Atualizar o tipo `fonte` de `'ordens_carregamento' | 'instalacoes'` para `'ordens_carregamento' | 'instalacoes' | 'correcoes'`
- Atualizar tambem no `src/types/ordemCarregamentoUnificada.ts`

### 3. `src/components/carregamento/CarregamentoKanban.tsx`

- Atualizar a logica `isInstalacao` para tambem reconhecer `fonte === 'correcoes'` com icone `Wrench` e badge "Correcao"

### Arquivos modificados
1. `src/hooks/useOrdensCarregamentoUnificadas.ts` -- adicionar query, normalizacao, mutation e subscription de correcoes
2. `src/types/ordemCarregamentoUnificada.ts` -- atualizar tipo `fonte`
3. `src/components/carregamento/CarregamentoKanban.tsx` -- exibir badge de correcao

