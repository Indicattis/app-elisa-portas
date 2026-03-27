

## Plano: Corrigir query do Arquivo Morto

### Problema
A query do `usePedidosArquivados` está retornando vazio (provavelmente erro 400 silencioso do PostgREST). A causa mais provável é **ambiguidade de FK** — as tabelas `instalacoes` e `ordens_carregamento` possuem FK para `pedidos_producao`, mas pode existir uma view com o mesmo nome, gerando ambiguidade no PostgREST quando se tenta fazer o join sem especificar a FK.

### Solução
Em `src/hooks/usePedidosArquivados.ts`, adicionar hints explícitos de FK nos joins:

```typescript
.select(`
  id, numero_pedido, cliente_nome, data_arquivamento, arquivado_por,
  etapa_atual, data_entrega, modalidade_instalacao, venda_id, valor_venda, created_at,
  vendas:venda_id(tipo_entrega),
  instalacoes!instalacoes_pedido_id_fkey(
    responsavel_instalacao_nome,
    tipo_instalacao
  ),
  ordens_carregamento!ordens_carregamento_pedido_id_fkey(
    responsavel_nome
  )
`)
```

Também adicionar tratamento de erro mais visível (console.error no catch) e verificar se o componente mostra estado de erro ao invés de "Nenhum pedido arquivado".

### Arquivo alterado
- `src/hooks/usePedidosArquivados.ts` — adicionar FK hints nos joins

