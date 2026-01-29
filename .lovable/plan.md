
# Plano: Corrigir Adição de Produtos do Catálogo na Venda

## Problema Identificado

No arquivo `SelecionarAcessoriosModal.tsx`, o produto é criado com o campo `estoque_id: item.id` (linha 105), mas a tabela `produtos_vendas` no banco de dados possui o campo `vendas_catalogo_id`, não `estoque_id`. Isso causa erro na inserção do produto.

---

## Alterações Necessárias

### 1. `src/components/vendas/SelecionarAcessoriosModal.tsx`

**Linha 105 - Alterar:**
```typescript
// DE:
estoque_id: item.id

// PARA:
vendas_catalogo_id: item.id
```

---

### 2. `src/hooks/useVendas.ts`

**Linha 17 - Atualizar interface ProdutoVenda:**
```typescript
// DE:
estoque_id?: string;

// PARA:
vendas_catalogo_id?: string;
```

---

### 3. `src/hooks/useProdutosVenda.ts`

**Linhas 34-43 - Adicionar tratamento do campo:**
```typescript
const produtoLimpo = {
  ...produto,
  tamanho: produto.tamanho || (produto.largura && produto.altura ? `${produto.largura}x${produto.altura}` : ''),
  largura: produto.largura || null,
  altura: produto.altura || null,
  cor_id: produto.cor_id || null,
  acessorio_id: produto.acessorio_id || null,
  adicional_id: produto.adicional_id || null,
  vendas_catalogo_id: produto.vendas_catalogo_id || null, // ADICIONAR
  descricao: produto.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : (produto.descricao || null),
};
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `SelecionarAcessoriosModal.tsx` | Trocar `estoque_id` por `vendas_catalogo_id` |
| `useVendas.ts` | Atualizar interface `ProdutoVenda` |
| `useProdutosVenda.ts` | Incluir `vendas_catalogo_id` no objeto limpo |

---

## Resultado Esperado

Produtos selecionados do catálogo serão inseridos corretamente na tabela `produtos_vendas` com o campo `vendas_catalogo_id` vinculando ao item do catálogo.
