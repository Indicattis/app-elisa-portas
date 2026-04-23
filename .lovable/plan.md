

## Mostrar último comentário sob o nome do cliente nas vendas pendentes

Hoje os cards de pedidos (`PedidoCard`) exibem o último comentário (de `pedido_comentarios`) em uma linha minúscula logo abaixo do nome do cliente. Os cards de vendas das abas **Pend. Faturamento** e **Aprovação Direção** não fazem isso, embora a tabela `venda_comentarios` já exista e seja usada no sheet de detalhes da venda.

### Mudança

**1. `src/components/pedidos/VendaPendentePedidoCard.tsx`** (cobre ambas abas — `mode='pedido'` Aprovação Direção e `mode='faturamento'` Pend. Faturamento)

Adicionar query do último comentário e renderizá-lo logo abaixo do `<h3>` do nome do cliente (linhas ~250-264):

```tsx
const { data: ultimoComentario } = useQuery({
  queryKey: ['venda-ultimo-comentario', venda.id],
  queryFn: async () => {
    const { data } = await (supabase
      .from('venda_comentarios' as any)
      .select('comentario, created_at')
      .eq('venda_id', venda.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any);
    return data as { comentario: string } | null;
  },
});
```

E logo após o `</Tooltip>` do nome (dentro do `<div className="min-w-0">`):

```tsx
{ultimoComentario && (
  <p className="text-[9px] text-muted-foreground truncate" title={ultimoComentario.comentario}>
    {ultimoComentario.comentario}
  </p>
)}
```

**2. `src/components/pedidos/VendaPendenteFaturamentoCard.tsx`** (card alternativo usado em algumas listas de Pend. Faturamento — atualmente só nome + cidade)

Mesma query e renderização: inserir a `<p>` truncada logo abaixo do `<p>` do `cliente_nome`, com `text-[10px]`.

### Estilo

Idêntico ao `PedidoCard`: `text-[9px]/text-[10px] text-muted-foreground truncate`, com `title` contendo o comentário completo.

### Fora de escopo

- Não altera `venda_comentarios` (tabela e RLS já existem).
- Não muda hooks `useVendasPendentePedido` / `useVendasPendenteFaturamento`.
- Não cria UI para adicionar comentários (já existe no sheet).

### Arquivos

- `src/components/pedidos/VendaPendentePedidoCard.tsx`
- `src/components/pedidos/VendaPendenteFaturamentoCard.tsx`

