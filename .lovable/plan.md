

# Corrigir agendamento nao concluido para ordens sinteticas

## Problema

Quando o modal abre com uma ordem sintetica (construida a partir dos dados do pedido porque nao foi encontrada em `ordensUnificadas`), o `onConfirm` chama `handleUpdateOrdem` com `id = pedido.id` e `fonte = 'ordens_carregamento'`. Porem, nao existe nenhum registro na tabela `ordens_carregamento` com esse ID -- o pedido simplesmente ainda nao tem uma ordem de carregamento criada.

O `updateOrdemMutation` no hook `useOrdensCarregamentoCalendario` faz um `UPDATE ... WHERE id = pedido.id` que atualiza zero linhas e nao gera erro, mas nada acontece. A rota de `instalacoes` ja tem logica de "orphan insert" (cria o registro se nao existir), mas a rota de `ordens_carregamento` nao tem essa mesma logica.

## Solucao

Adicionar logica de "orphan insert" na rota de `ordens_carregamento` do `updateOrdemMutation`, similar ao que ja existe para `instalacoes`:

1. Antes de fazer o UPDATE, verificar se o registro existe com `maybeSingle()`
2. Se nao existir, buscar dados do pedido e fazer INSERT na tabela `ordens_carregamento`
3. Se existir, fazer UPDATE normalmente (comportamento atual)

## Mudancas

**Arquivo:** `src/hooks/useOrdensCarregamentoCalendario.ts`

Na secao `else` (linhas 295-304) do `updateOrdemMutation`, que trata `fonte === 'ordens_carregamento'`:

1. Adicionar verificacao de existencia do registro com `supabase.from("ordens_carregamento").select("id").eq("id", id).maybeSingle()`
2. Se o registro nao existir:
   - Buscar o pedido em `pedidos_producao` para obter `venda_id` e `cliente_nome`
   - Inserir novo registro em `ordens_carregamento` com os campos: `pedido_id = id`, `venda_id`, `nome_cliente`, `data_carregamento`, `hora`, `tipo_carregamento`, `responsavel_carregamento_id`, `responsavel_carregamento_nome`, `status = 'agendada'`, `carregamento_concluido = false`
3. Se o registro existir: manter o UPDATE atual

Isso espelha a mesma abordagem de "orphan handling" que ja funciona para instalacoes (linhas 238-274 do mesmo arquivo).
