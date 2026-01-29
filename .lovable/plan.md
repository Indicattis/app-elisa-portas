
# Plano: Edição de Quantidade na Página de Edição de Venda e Remover Botão Serviço

## Resumo

1. Remover o botão "Serviço" que ainda aparece na página de edição de venda
2. Permitir edição de quantidade com suporte a decimais para itens vendidos por Metro/Kg/Litro

---

## Problema Identificado

### 1. Botão "Serviço" ainda visível
- **Arquivo:** `src/pages/vendas/VendaEditarMinimalista.tsx` (linhas 470-483)
- O botão "Serviço" ainda está presente, mas deveria ter sido removido conforme a regra de que "Manutenção" é um tipo de entrega, não um produto

### 2. Quantidade não editável
- **Arquivo:** `src/pages/vendas/VendaEditarMinimalista.tsx`
- O componente `ProdutosVendaTable` recebe `produtosFormatados` mas:
  - Não recebe callback `onUpdateQuantidade`
  - Não inclui o campo `unidade` no mapeamento de produtos

---

## Alterações Necessárias

### Arquivo: `src/pages/vendas/VendaEditarMinimalista.tsx`

#### 1. Remover o botão "Serviço" (linhas 470-483)

**Código a remover:**
```typescript
<Button 
  type="button"
  size="sm"
  variant="outline"
  className="border-primary/30 text-white hover:bg-primary/10"
  onClick={() => {
    setTipoInicial('manutencao');
    setPermitirTrocaTipo(false);
    setShowProdutoForm(true);
  }}
>
  <Plus className="w-3.5 h-3.5 mr-1.5" />
  Serviço
</Button>
```

#### 2. Adicionar `unidade` ao mapeamento de produtos (linhas 126-143)

**Atualizar:**
```typescript
const produtosFormatados: ProdutoVenda[] = (produtos || []).map(p => ({
  // ... campos existentes
  descricao: p.descricao || '',
  unidade: p.unidade || 'Unitário'  // NOVO CAMPO
}));
```

#### 3. Adicionar função de atualização de quantidade

**Adicionar handler:**
```typescript
const handleUpdateQuantidade = async (index: number, quantidade: number) => {
  const produto = produtos?.[index];
  if (!produto?.id) return;
  
  try {
    await updateProduto({
      produtoId: produto.id,
      updates: { quantidade }
    });
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
  }
};
```

#### 4. Passar `onUpdateQuantidade` para `ProdutosVendaTable`

**Atualizar:**
```typescript
<ProdutosVendaTable 
  produtos={produtosFormatados} 
  onRemoveProduto={async (index: number) => { ... }}
  onRemoverDesconto={handleRemoverDesconto}
  onUpdateQuantidade={handleUpdateQuantidade}  // NOVO
/>
```

---

## Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Remover botão "Serviço" |
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Adicionar `unidade` ao mapeamento `produtosFormatados` |
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Criar handler `handleUpdateQuantidade` |
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Passar `onUpdateQuantidade` para `ProdutosVendaTable` |

---

## Resultado Esperado

1. O botão "Serviço" não aparecerá mais na página de edição de venda
2. A coluna "Qtd" na tabela de produtos terá inputs editáveis:
   - Itens unitários: incremento de 1 em 1
   - Itens vendidos por Metro/Kg/Litro: permitirá decimais (ex: 2.50m)
   - Exibirá a abreviação da unidade ao lado (ex: "m", "kg")
