
# Plano: Corrigir Página de Edição de Venda (Arquivo Correto)

## Diagnóstico

O problema foi que todas as edições anteriores foram feitas no arquivo **`VendaEditarMinimalista.tsx`**, mas a rota `/vendas/minhas-vendas/editar/:id` usa o arquivo **`MinhasVendasEditar.tsx`**.

## Alterações Necessárias

### Arquivo: `src/pages/vendas/MinhasVendasEditar.tsx`

#### 1. Adicionar `unidade` ao mapeamento de produtos (linha ~147-164)

```typescript
const produtosFormatados: ProdutoVenda[] = (produtos || []).map(p => ({
  // ... campos existentes
  descricao: p.descricao || '',
  unidade: (p as any).unidade || 'Unitário'  // ADICIONAR
}));
```

#### 2. Adicionar função handleUpdateQuantidade (após linha ~280)

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

#### 3. Adicionar componente ProductButton (antes do return)

```typescript
const ProductButton = ({ 
  label, 
  onClick 
}: { 
  label: string; 
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-2 h-10 px-4 rounded-lg
               bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/25 text-blue-200
               hover:from-blue-500/20 hover:to-blue-600/10 hover:text-white hover:border-blue-400/40 
               hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
  >
    <Plus className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);
```

#### 4. Substituir botões antigos pelos novos (linhas 572-665)

**Remover:**
- Botão "Acessórios" (não existe na página nova)
- Botão "Adicionais" (não existe na página nova)
- Botão "Serviço" (manutenção é tipo de entrega, não produto)

**Manter (com novo estilo):**
- Porta de Enrolar
- Porta Social
- Pintura Eletrostática
- Catálogo

#### 5. Passar onUpdateQuantidade para ProdutosVendaTable (linha ~718)

```typescript
<ProdutosVendaTable 
  produtos={produtosFormatados} 
  onRemoveProduto={...}
  onRemoverDesconto={handleRemoverDesconto}
  onUpdateQuantidade={handleUpdateQuantidade}  // ADICIONAR
/>
```

---

## Resumo de Alterações

| Local | Alteração |
|-------|-----------|
| Linha ~147-164 | Adicionar `unidade` ao mapeamento |
| Após linha ~280 | Adicionar função `handleUpdateQuantidade` |
| Antes do return | Adicionar componente `ProductButton` |
| Linhas 572-665 | Substituir 7 botões por 4 ProductButton |
| Linha ~718 | Passar `onUpdateQuantidade` para tabela |

---

## Resultado Esperado

1. Os 4 botões (Porta de Enrolar, Porta Social, Pintura Eletrostática, Catálogo) terão o mesmo visual da página de nova venda
2. Os botões "Acessórios", "Adicionais" e "Serviço" serão removidos
3. A quantidade dos produtos poderá ser editada diretamente na tabela
4. Itens com unidade "Metro", "Kg" ou "Litro" permitirão decimais
