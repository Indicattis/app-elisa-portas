

# Plano: Corrigir Exibição de Itens da Venda na Downbar

## Problema Identificado

Os itens da venda estão sempre mostrando "0" e "Nenhum item na venda" porque há uma **incompatibilidade no nome da propriedade** entre a fonte de dados e o componente que a consome.

### Fluxo Atual

```text
useOrdensInstalacao.ts
│
├─ Query Supabase:
│   produtos:produtos_vendas(...)
│   ↓
│   Resultado: venda.produtos = [{...}, {...}]
│
handleOpenDetalhes()
│
├─ Passa: ordem.venda (com .produtos)
│   ↓
│   pedidoForSheet.vendas = ordem.venda
│
PedidoDetalhesSheet.tsx
│
└─ Procura: venda.produtos_vendas (UNDEFINED!)
   ↓
   const produtos = venda.produtos_vendas || [];  // = []
   ↓
   Mostra "0 itens" e "Nenhum item na venda"
```

### Causa Raiz

| Arquivo | Propriedade Usada | Valor |
|---------|-------------------|-------|
| `useOrdensInstalacao.ts` | `venda.produtos` | Array com itens |
| `PedidoDetalhesSheet.tsx` | `venda.produtos_vendas` | **undefined** |

---

## Solução

Modificar o `handleOpenDetalhes` em `OrdensInstalacoesLogistica.tsx` para **renomear a propriedade** `produtos` para `produtos_vendas` ao construir o objeto `pedidoForSheet.vendas`.

### Arquivo a Modificar

`src/pages/logistica/OrdensInstalacoesLogistica.tsx`

### Código Atual (linhas 185-197)

```typescript
const handleOpenDetalhes = (ordem: OrdemInstalacao) => {
  if (ordem.pedido) {
    const pedidoForSheet = {
      id: ordem.pedido.id,
      numero_pedido: ordem.pedido.numero_pedido,
      numero_mes: (ordem.pedido as any).numero_mes,
      mes_vigencia: (ordem.pedido as any).mes_vigencia,
      etapa_atual: ordem.pedido.etapa_atual,
      vendas: ordem.venda  // <-- Problema: venda.produtos
    };
    setSelectedPedido(pedidoForSheet);
    setShowDetalhes(true);
  }
};
```

### Código Corrigido

```typescript
const handleOpenDetalhes = (ordem: OrdemInstalacao) => {
  if (ordem.pedido) {
    // Mapear produtos para produtos_vendas (formato esperado pelo PedidoDetalhesSheet)
    const vendaComProdutosVendas = ordem.venda ? {
      ...ordem.venda,
      produtos_vendas: ordem.venda.produtos // Renomear para o formato esperado
    } : null;

    const pedidoForSheet = {
      id: ordem.pedido.id,
      numero_pedido: ordem.pedido.numero_pedido,
      numero_mes: (ordem.pedido as any).numero_mes,
      mes_vigencia: (ordem.pedido as any).mes_vigencia,
      etapa_atual: ordem.pedido.etapa_atual,
      vendas: vendaComProdutosVendas
    };
    setSelectedPedido(pedidoForSheet);
    setShowDetalhes(true);
  }
};
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Badge mostra "0" | Badge mostra quantidade correta de itens |
| Expandir mostra "Nenhum item na venda" | Expandir mostra lista de produtos |

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/logistica/OrdensInstalacoesLogistica.tsx` | Mapear `venda.produtos` → `produtos_vendas` |

---

## Por que Esta Abordagem?

1. **Mínima alteração**: Apenas 1 arquivo modificado
2. **Sem efeitos colaterais**: Não altera a interface do componente `PedidoDetalhesSheet`
3. **Consistência**: O `PedidoDetalhesSheet` é usado em múltiplos lugares que já passam `produtos_vendas`

