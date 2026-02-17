
# Corrigir agendamento de ordens orfaos via painel lateral

## Problema

O fix anterior foi aplicado apenas no hook `useOrdensCarregamentoCalendario.ts` (usado pelos cards do calendario). Porem, o agendamento via painel lateral "Ordens Disponiveis para Agendamento" usa codigo diferente -- a funcao `handleConfirmAgendar` em dois arquivos faz chamadas diretas ao Supabase sem tratar pedidos orfaos. Para orfaos, o `id` da ordem e na verdade o `pedido_id`, entao o `.update().eq("id", ordemId)` na tabela `instalacoes` nao encontra nenhum registro e silenciosamente falha.

## Solucao

Aplicar a mesma logica de "verificar se existe, senao INSERT" nos dois arquivos que fazem agendamento direto:

### 1. Arquivo: `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx`

Na funcao `handleConfirmAgendar` (linhas 140-184), quando `fonte === 'instalacoes'`:

1. Antes do UPDATE, verificar se existe registro na tabela `instalacoes` com aquele `id`
2. Se nao existir (orfao): buscar dados do pedido em `pedidos_producao` + `vendas`, e fazer INSERT com os dados de agendamento
3. Se existir: fazer UPDATE normalmente como ja funciona

### 2. Arquivo: `src/components/expedicao/OrdensCarregamentoDisponiveisMobile.tsx`

Mesma alteracao na funcao `handleConfirmAgendar` (linhas 132-177).

### Logica do INSERT (identica ao hook)

```
// Verificar existencia
const { data: existing } = await supabase
  .from("instalacoes").select("id").eq("id", ordemId).maybeSingle();

if (!existing && fonte === 'instalacoes') {
  // Buscar dados do pedido
  const { data: pedido } = await supabase
    .from("pedidos_producao")
    .select("id, venda_id, vendas(cliente_nome)")
    .eq("id", ordemId).maybeSingle();

  // INSERT novo registro
  await supabase.from("instalacoes").insert({
    pedido_id: ordemId,
    venda_id: pedido?.venda_id,
    nome_cliente: pedido?.vendas?.cliente_nome,
    hora: '08:00',
    status: 'pronta_fabrica',
    instalacao_concluida: false,
    carregamento_concluido: false,
    data_carregamento, hora_carregamento, tipo_carregamento,
    responsavel_carregamento_id, responsavel_carregamento_nome
  });
} else {
  // UPDATE normal
}
```

### Nenhuma outra alteracao necessaria

A contagem de "Ordens Disponiveis para Agendamento" ja esta correta (o hook `useOrdensCarregamentoUnificadas` ja identifica e lista os pedidos orfaos). O problema e apenas que o agendamento falha silenciosamente ao tentar atualizar um registro inexistente.
