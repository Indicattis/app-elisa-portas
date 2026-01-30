

# Exibir Tamanhos nas Linhas de Pintura

## Problema

Os tamanhos dos itens (ex: "2,81m") existem em `pedido_linhas`, mas não estão sendo exibidos nas linhas de pintura porque o campo `tamanho` em `linhas_ordens` está vazio.

## Solução

Buscar o `tamanho` de `pedido_linhas` durante o carregamento das ordens de pintura e associar às linhas correspondentes.

## Alterações Técnicas

### Arquivo: `src/hooks/useOrdemPintura.ts`

**1. Atualizar query de pedido_linhas (linha 91-93):**

Incluir o campo `tamanho` na seleção:

```typescript
// ANTES:
const { data: linhasPedido } = await supabase
  .from('pedido_linhas')
  .select('nome_produto, produto_venda_id, quantidade')
  .eq('pedido_id', ordem.pedido_id);

// DEPOIS:
const { data: linhasPedido } = await supabase
  .from('pedido_linhas')
  .select('nome_produto, produto_venda_id, quantidade, tamanho')
  .eq('pedido_id', ordem.pedido_id);
```

**2. Atualizar mapeamento das linhas (linhas 96-123):**

Usar o `tamanho` da linha original do pedido quando a linha de pintura não tiver:

```typescript
const linhas = linhasRaw?.map((linha: any) => {
  // ... lógica existente para encontrar produtoVendaId ...
  
  // Buscar linha original do pedido para obter tamanho
  const linhaOriginal = linhasPedido?.find((lp: any) => 
    (lp.nome_produto === linha.item || 
     lp.nome_produto?.includes(linha.item) || 
     linha.item?.includes(lp.nome_produto) ||
     linha.estoque?.nome_produto === lp.nome_produto) &&
    lp.quantidade === linha.quantidade
  );
  
  return {
    ...linha,
    item: linha.estoque?.nome_produto || linha.item,
    requer_pintura: linha.estoque?.requer_pintura ?? true,
    produto_venda_id: produtoVendaId,
    largura: linha.largura || produtoVenda?.largura || null,
    altura: linha.altura || produtoVenda?.altura || null,
    tamanho: linha.tamanho || linhaOriginal?.tamanho || null  // ADICIONAR
  };
}) || [];
```

## Resultado Esperado

Na visualização de ordens de pintura em `/producao/pintura`, cada linha mostrará seu tamanho (ex: "2.81m") ao lado da quantidade, assim como aparece em `/direcao/pedidos/:id`.

| Item | Quantidade | Tamanho |
|------|------------|---------|
| Eixo - 4" 1/2 | Qtd: 1 | 2.81m |
| Guia M - 135mm | Qtd: 2 | 2.31m |
| Meia cana lisa | Qtd: 35 | 2.85m |

