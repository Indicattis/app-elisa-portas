
# Corrigir verificacao de carregamento para pedidos de instalacao

## Problema
Ao tentar avancar o pedido `08a91857` (que esta na etapa `instalacoes`), o sistema exibe "A ordem de carregamento ainda nao foi concluida em Expedicao". Isso acontece porque a funcao `handleConfirmarExpedicao` no PedidoCard.tsx (linha 1061-1065) so consulta a tabela `ordens_carregamento`, mas pedidos do tipo instalacao tem seus registros de carregamento na tabela `instalacoes`.

## Solucao
Alterar a verificacao de carregamento em `handleConfirmarExpedicao` para consultar ambas as tabelas (`ordens_carregamento` e `instalacoes`) dependendo da etapa do pedido, ou consultar ambas e considerar qualquer uma como valida.

## Alteracao

### Arquivo: `src/components/pedidos/PedidoCard.tsx` (linhas 1056-1079)

Substituir a consulta unica a `ordens_carregamento` por uma verificacao que tambem consulta a tabela `instalacoes`:

```text
1. Consultar ordens_carregamento pelo pedido_id
2. Se nao encontrou ou carregamento_concluido = false:
   - Consultar instalacoes pelo pedido_id
   - Se encontrou com carregamento_concluido = true: considerar como concluido
3. Se nenhuma das duas retornou carregamento concluido:
   - Consultar correcoes pelo pedido_id  
   - Se encontrou com carregamento_concluido = true: considerar como concluido
4. Se nenhuma fonte confirmou: exibir erro
```

Seguindo o padrao ja usado no hook `useOrdensCarregamentoUnificadas`, a consulta usara `.order('created_at', { ascending: false }).limit(1)` em vez de `.maybeSingle()` para lidar com registros duplicados (conforme memoria de arquitetura).
