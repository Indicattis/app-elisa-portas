

# Corrigir agendamento de ordens de carregamento para pedidos "orfaos"

## Problema

O pedido 0216 (Paulo Roberto Lemos Schramm) esta na etapa `instalacoes` mas nao possui registro na tabela `instalacoes` nem em `ordens_carregamento`. O sistema identifica corretamente esses pedidos como "orfaos" e os exibe na lista de ordens disponiveis. Porem, ao tentar agendar, o sistema tenta fazer `UPDATE` na tabela `instalacoes` usando o `pedido_id` como `id` do registro -- que nao existe. O update silenciosamente nao afeta nenhuma linha e nada acontece.

## Solucao

Modificar a mutation `updateOrdemMutation` no hook `useOrdensCarregamentoCalendario.ts` para detectar quando o registro nao existe na tabela `instalacoes` e, nesse caso, criar (INSERT) um novo registro ao inves de tentar atualizar.

### Arquivo: `src/hooks/useOrdensCarregamentoCalendario.ts`

Na secao `fonte === 'instalacoes'` da `updateOrdemMutation`:

1. Antes de fazer o UPDATE, verificar se o registro com aquele `id` existe na tabela `instalacoes`
2. Se nao existir, buscar os dados do pedido (pedido_id, venda_id, nome_cliente) na tabela `pedidos_producao` + `vendas`
3. Fazer um INSERT na tabela `instalacoes` com os dados basicos do pedido junto com os dados de agendamento (data_carregamento, hora, responsavel, etc.)
4. Se existir, continuar com o UPDATE normalmente como ja funciona hoje

Logica do INSERT para orfaos:

```
INSERT INTO instalacoes (
  pedido_id: id,         -- o "id" passado e na verdade o pedido_id
  venda_id,              -- buscado do pedido
  nome_cliente,          -- buscado da venda
  hora: '08:00',
  status: 'pronta_fabrica',
  instalacao_concluida: false,
  carregamento_concluido: false,
  data_carregamento,
  hora_carregamento,
  tipo_carregamento,
  responsavel_carregamento_id,
  responsavel_carregamento_nome
)
```

### Nenhuma outra alteracao necessaria

O restante do fluxo (listagem no calendario, cards, etc.) ja funciona corretamente uma vez que o registro exista na tabela `instalacoes`.

