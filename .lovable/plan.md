

## Plano: Expandir produtos com quantidade > 1 em linhas individuais no cadastro de vendas

### Problema
Quando um produto é cadastrado com quantidade 2+, ele é salvo como uma única linha no banco com `quantidade: 2`. Isso gera inconsistências nas telas de visualização e produção. O desejado é que cada unidade seja uma linha separada no `produtos_vendas`.

### Solução
Alterar a lógica de inserção de produtos em `src/hooks/useVendas.ts` para expandir produtos com `quantidade > 1` em múltiplas linhas individuais (cada uma com `quantidade: 1`), mantendo os mesmos valores unitários.

### Alterações

**Arquivo: `src/hooks/useVendas.ts`**

Nos dois pontos de inserção de produtos (criação de venda ~linha 330 e salvamento de rascunho ~linha 594), substituir o `.map()` simples por um `.flatMap()` que expande cada produto:

```typescript
const produtosComVendaId = portas.flatMap(produto => {
  const qty = produto.quantidade || 1;
  const base = {
    venda_id: venda.id,
    tipo_produto: produto.tipo_produto,
    tamanho: produto.tamanho || '',
    cor_id: produto.cor_id || null,
    acessorio_id: produto.acessorio_id || null,
    adicional_id: produto.adicional_id || null,
    valor_produto: produto.valor_produto,
    valor_pintura: produto.valor_pintura,
    valor_instalacao: produto.valor_instalacao,
    valor_frete: produto.valor_frete,
    tipo_desconto: produto.tipo_desconto,
    desconto_percentual: produto.desconto_percentual,
    desconto_valor: produto.desconto_valor,
    quantidade: 1,  // sempre 1
    descricao: produto.tipo_produto === 'porta_enrolar' 
      ? 'Porta de Enrolar' : (produto.descricao || null),
    valor_credito: produto.valor_credito || 0,
    percentual_credito: produto.percentual_credito || 0
  };
  return Array.from({ length: qty }, () => ({ ...base }));
});
```

### Impacto
- Novas vendas terão cada produto como linha individual
- Vendas existentes não são afetadas
- As telas de visualização que já usam `expandirPortasPorQuantidade` continuarão funcionando (mas agora sem necessidade de expandir, já que `quantidade` será sempre 1)

