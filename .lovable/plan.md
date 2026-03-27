

## Plano: Filtrar ajuste de pontuação por tipo de entrega

### Problema
A seção "Ajuste de Pontuação" está listando todos os pedidos finalizados com instalação pendente, incluindo pedidos de **entrega** (que não têm instalação). Devem aparecer apenas vendas com `tipo_entrega = 'instalacao'` ou `tipo_entrega = 'manutencao'`.

### Solução
Alterar a query em `src/hooks/useAjustePontuacaoInstalacao.ts` para fazer JOIN até a tabela `vendas` via `pedidos_producao.venda_id` e filtrar por `tipo_entrega in ('instalacao', 'manutencao')`.

### Detalhes técnicos

**`src/hooks/useAjustePontuacaoInstalacao.ts`** — alterar o select da query:

```typescript
const { data, error } = await supabase
  .from('instalacoes')
  .select(`
    id,
    nome_cliente,
    responsavel_instalacao_id,
    instalacao_concluida,
    pedido_id,
    pedidos_producao!inner (
      id,
      numero_pedido,
      etapa_atual,
      created_at,
      venda_id,
      vendas!inner (
        tipo_entrega
      )
    )
  `)
  .eq('pedidos_producao.etapa_atual', 'finalizado')
  .in('pedidos_producao.vendas.tipo_entrega', ['instalacao', 'manutencao'])
  .or('responsavel_instalacao_id.is.null,instalacao_concluida.eq.false');
```

### Arquivo alterado
- `src/hooks/useAjustePontuacaoInstalacao.ts`

