
# Plano: Corrigir Query de Linhas de Pintura

## Problema Identificado

A alteração anterior adicionou um JOIN inválido na query de `linhas_ordens`:

```typescript
// LINHA 78 - PROBLEMÁTICA
produto_venda:produto_venda_id (largura, altura)
```

Não existe foreign key entre `linhas_ordens.produto_venda_id` e `produtos_vendas`, causando erro 400 em todas as requisições.

## Solução

Remover o JOIN problemático e buscar as dimensões diretamente dos produtos da venda que já estão sendo carregados no pedido.

---

## Alteração Necessária

### Arquivo: `src/hooks/useOrdemPintura.ts`

**Linhas 73-90** - Remover o join inválido e ajustar o processamento:

**Código atual (quebrado):**
```typescript
const { data: linhasRaw } = await supabase
  .from('linhas_ordens')
  .select(`
    id, item, quantidade, tamanho, concluida, largura, altura, estoque_id, produto_venda_id, cor_nome, tipo_pintura,
    estoque:estoque_id (nome_produto, requer_pintura),
    produto_venda:produto_venda_id (largura, altura)
  `)
  .eq('ordem_id', ordem.id)
  .eq('tipo_ordem', 'pintura');
```

**Código corrigido:**
```typescript
const { data: linhasRaw } = await supabase
  .from('linhas_ordens')
  .select(`
    id, item, quantidade, tamanho, concluida, largura, altura, estoque_id, produto_venda_id, cor_nome, tipo_pintura,
    estoque:estoque_id (nome_produto, requer_pintura)
  `)
  .eq('ordem_id', ordem.id)
  .eq('tipo_ordem', 'pintura');

// Buscar dimensões dos produtos da venda
const linhas = linhasRaw?.map((linha: any) => {
  // Tentar encontrar dimensões no produto correspondente
  const produtoVenda = produtos.find((p: any) => p.id === linha.produto_venda_id);
  
  return {
    ...linha,
    item: linha.estoque?.nome_produto || linha.item,
    requer_pintura: linha.estoque?.requer_pintura ?? true,
    largura: linha.largura || produtoVenda?.largura || null,
    altura: linha.altura || produtoVenda?.altura || null
  };
}) || [];
```

---

## Resumo

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `src/hooks/useOrdemPintura.ts` | 73-90 | Remover JOIN inválido e usar produtos já carregados |

Esta correção vai restaurar o funcionamento das ordens de pintura imediatamente.
