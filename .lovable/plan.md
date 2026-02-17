
# Corrigir lista de ordens disponiveis para agendamento

## Problema

Dois problemas distintos causam a discrepancia:

### Problema 1: Ordens aparecendo indevidamente (0119 Silmar, 0136 Mariza, 0146 Odir)
Esses pedidos possuem registros em `instalacoes` com `carregamento_concluido = true`. A query atual filtra por `carregamento_concluido = false`, entao esses registros nao entram na variavel `instalacoes`. Como resultado, o Set `todosIdsInstalacoes` nao inclui esses pedido_ids, e os registros "orfaos" em `ordens_carregamento` (com `carregamento_concluido = false`) passam pela deduplicacao e aparecem na lista.

### Problema 2: Ordens que deveriam aparecer mas nao aparecem (0189, 0194, 0216, 0217)
Esses pedidos estao nas etapas corretas (`instalacoes` ou `aguardando_coleta`) mas NAO possuem registros em nenhuma das duas tabelas (`instalacoes` nem `ordens_carregamento`). Como o hook so busca dados dessas duas tabelas, esses pedidos simplesmente nao existem na lista.

## Solucao

### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

#### Correcao 1: Buscar TODOS os pedido_ids de instalacoes para deduplicacao

Adicionar uma query separada e leve para obter todos os `pedido_id` da tabela `instalacoes` (sem filtros), usada exclusivamente para deduplicacao:

```typescript
// Query leve: buscar TODOS os pedido_ids de instalacoes (sem filtros)
const { data: todosInstalacoesPedidoIds } = await supabase
  .from("instalacoes")
  .select("pedido_id")
  .not("pedido_id", "is", null);

const todosIdsInstalacoes = new Set(
  (todosInstalacoesPedidoIds || []).map(i => i.pedido_id)
);
```

Usar esse Set na deduplicacao cruzada em vez do Set construido a partir da query filtrada.

#### Correcao 2: Buscar pedidos "orfaos" diretamente da tabela pedidos_producao

Adicionar uma query para pedidos nas etapas relevantes que nao possuem registros em nenhuma das duas tabelas, e criar entradas sinteticas para eles:

```typescript
// Buscar pedidos nas etapas de instalacao/coleta que nao tem registros
const { data: pedidosOrfaos } = await supabase
  .from("pedidos_producao")
  .select(`
    id,
    numero_pedido,
    etapa_atual,
    observacoes,
    updated_at,
    vendas!inner(
      id, cliente_nome, cliente_telefone, cliente_email,
      cidade, estado, bairro, cep, tipo_entrega, atendente_id,
      produtos:produtos_vendas(
        tipo_produto, tamanho, largura, altura, quantidade,
        cor:catalogo_cores(nome, codigo_hex)
      )
    )
  `)
  .in("etapa_atual", ["instalacoes", "aguardando_coleta"]);
```

Filtrar apenas os que nao tem registro em `instalacoes` nem em `ordens_carregamento`, e adiciona-los como entradas sinteticas do tipo `instalacoes` na lista final.

### Impacto
- Pedidos com carregamento ja concluido na tabela instalacoes nao vazam mais via ordens_carregamento
- Pedidos nas etapas corretas sem registro em nenhuma tabela passam a aparecer
- A contagem de ordens disponiveis vai coincidir com os pedidos nao agendados em /logistica/controle
