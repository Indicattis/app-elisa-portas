
# Plano: Corrigir Ordem de Declaração de Variáveis

## Problema Identificado

No arquivo `src/hooks/useOrdemPintura.ts`, há um erro de ordem de declaração:

**Linha 85** - Usa `produtos` antes de ser declarado:
```typescript
const produtoVenda = produtos.find((p: any) => p.id === linha.produto_venda_id);
```

**Linha 99** - Declara `produtos` depois de ser usado:
```typescript
const produtos = primeiraVenda?.produtos || [];
```

Isso causa um erro de referência que quebra todo o processamento das ordens.

---

## Solução

Mover a declaração de `produtos` para **antes** do bloco que processa as linhas.

---

## Alteração Necessária

### Arquivo: `src/hooks/useOrdemPintura.ts`

**Reorganizar o código entre as linhas 72-100:**

**Código corrigido:**
```typescript
// Processar produtos da venda PRIMEIRO
const vendasArray = Array.isArray(pedido?.vendas) ? pedido.vendas : [pedido?.vendas];
const primeiraVenda = vendasArray.length > 0 ? vendasArray[0] : null;
const produtos = primeiraVenda?.produtos || [];

// Buscar linhas com nome atualizado do estoque e campo requer_pintura
const { data: linhasRaw } = await supabase
  .from('linhas_ordens')
  .select(`
    id, item, quantidade, tamanho, concluida, largura, altura, estoque_id, produto_venda_id, cor_nome, tipo_pintura,
    estoque:estoque_id (nome_produto, requer_pintura)
  `)
  .eq('ordem_id', ordem.id)
  .eq('tipo_ordem', 'pintura');

// Processar linhas (agora produtos já está disponível)
const linhas = linhasRaw?.map((linha: any) => {
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

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/hooks/useOrdemPintura.ts` | 72-100 | Mover declaracao de `produtos` para antes do uso |

Esta correção simples vai restaurar o funcionamento imediatamente.
