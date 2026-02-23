

# Corrigir pre-selecao do modal de agendamento

## Problema

O `handleAgendarPedido` busca a ordem em `ordensUnificadas` por `pedido_id`, mas em varios casos a ordem nao e encontrada:
- Os dados de `ordensUnificadas` ainda nao carregaram (array vazio)
- Pedidos na etapa `correcoes` nao sao incluidos pelo hook `useOrdensCarregamentoUnificadas`
- Quando nao encontra, `ordemPreSelecionadaAgendar` fica `null` e o modal exibe a lista completa

## Solucao

Quando a ordem nao for encontrada em `ordensUnificadas`, construir um objeto sintetico `OrdemCarregamentoUnificada` a partir dos dados do pedido que ja estao disponiveis na listagem (via `pedidosFiltrados`).

## Mudancas

**Arquivo:** `src/pages/logistica/ExpedicaoMinimalista.tsx`

1. Alterar `handleAgendarPedido` para, caso `ordensUnificadas.find()` retorne `undefined`:
   - Buscar o pedido em `pedidosFiltrados` (que ja esta disponivel no componente)
   - Construir um objeto `OrdemCarregamentoUnificada` sintetico com os dados do pedido (id, pedido_id, nome_cliente, tipo_entrega, etc.)
   - Usar esse objeto como `ordemPreSelecionadaAgendar`

2. Aplicar a mesma logica de fallback nos handlers `onAgendar` das Neo Instalacoes e Neo Correcoes (linhas ~831 e ~854), construindo o objeto sintetico a partir dos dados do servico Neo quando a ordem nao for encontrada

Assim, mesmo que `ordensUnificadas` esteja vazio ou nao contenha o pedido, o modal sempre abrira com a ordem pre-selecionada.

### Detalhes tecnicos do objeto sintetico

```typescript
const ordemSintetica: OrdemCarregamentoUnificada = {
  id: pedido.id,
  fonte: 'ordens_carregamento',
  pedido_id: pedido.id,
  venda_id: pedido.venda_id || null,
  nome_cliente: pedido.venda?.cliente_nome || pedido.cliente_nome || '',
  data_carregamento: null,
  hora_carregamento: null,
  hora: null,
  tipo_carregamento: null,
  responsavel_carregamento_id: null,
  responsavel_carregamento_nome: null,
  carregamento_concluido: false,
  status: null,
  tipo_entrega: pedido.venda?.tipo_entrega || 'entrega',
  pedido: { id: pedido.id, numero_pedido: pedido.numero_pedido },
  venda: pedido.venda || null,
};
```

O campo `fonte` sera determinado pelo `tipo_entrega`: se for `instalacao` ou `manutencao` usa `'instalacoes'`, caso contrario `'ordens_carregamento'`.
