

# Corrigir deduplicacao cruzada entre ordens_carregamento e instalacoes

## Problema

Todos os 18 pedidos que aparecem como "disponiveis" na expedicao possuem `tipo_entrega = 'instalacao'` e todos tem um registro correspondente na tabela `instalacoes`. A maioria desses registros na tabela `instalacoes` ja tem `data_carregamento` agendada (ou ate `carregamento_concluido = true`), mas os registros na tabela `ordens_carregamento` permanecem com `data_carregamento = null` e `carregamento_concluido = false`.

O problema esta na deduplicacao cruzada: atualmente, o hook so remove registros de `ordens_carregamento` cujo `pedido_id` esteja em `instalacoesParaCarregar` (a lista filtrada de instalacoes). Porem, instalacoes ja concluidas (`carregamento_concluido = true`) ou ja agendadas nao estao nessa lista filtrada, fazendo com que os registros "orfaos" de `ordens_carregamento` vazem para a lista de disponiveis.

Exemplo concreto:
- Pedido 0119 (Silmar Dewes): instalacao ja com `carregamento_concluido = true`, mas `ordens_carregamento` ainda aparece como disponivel
- Pedido 0136 (Mariza): mesma situacao
- Resultado: 18 ordens aparecendo quando deveriam ser apenas ~1 (pedido 0163, unico com instalacao sem data_carregamento)

## Solucao

### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Usar TODOS os `pedido_id` da tabela `instalacoes` (antes do filtro) para a deduplicacao, nao apenas os da lista filtrada `instalacoesParaCarregar`. Assim, qualquer pedido que tenha um registro em `instalacoes` sera gerenciado exclusivamente por essa tabela.

### Detalhes tecnicos

1. Criar um Set com todos os `pedido_id` de `instalacoes` (resultado bruto da query, antes do filtro de etapa/status):
```typescript
const todosIdsInstalacoes = new Set(
  (instalacoes || []).map(i => i.pedido_id).filter(Boolean)
);
```

2. Na deduplicacao cruzada (linha ~216-217), usar `todosIdsInstalacoes` em vez de `pedidoIdsInstalacoes`:
```typescript
const ordensDeduplicadas = ordensUnicasPorPedido.filter(
  o => !o.pedido_id || !todosIdsInstalacoes.has(o.pedido_id)
);
```

Isso garante que registros de `ordens_carregamento` cujo pedido ja tem uma instalacao (mesmo que ja agendada ou concluida) nunca apareçam na lista.

### Impacto
- Pedidos de instalacao/manutencao serao gerenciados exclusivamente pela tabela `instalacoes`
- Apenas pedidos de entrega (sem registro em `instalacoes`) virao da tabela `ordens_carregamento`
- O numero de ordens disponiveis vai corresponder ao que aparece em `/logistica/controle`

