
# Plano: Ordenar por Data Decrescente e Adicionar Botao "Gerar Pedido"

## Alteracoes Necessarias

### 1. Ordenacao por Data Decrescente
Atualmente o codigo ordena por `dias_desde_faturamento` (mais antigos primeiro). Vou alterar para ordenar por `data_venda` decrescente (mais recentes primeiro).

**Linha 136-137 - Alterar de:**
```typescript
// Ordenar por dias desde faturamento (mais antigos primeiro)
vendasProcessadas.sort((a, b) => b.dias_desde_faturamento - a.dias_desde_faturamento);
```

**Para:**
```typescript
// Ordenar por data decrescente (mais recentes primeiro)
vendasProcessadas.sort((a, b) => 
  new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()
);
```

### 2. Adicionar Botao "Gerar Pedido"

Vou usar o hook `usePedidoCreation` que ja existe no projeto para criar o pedido diretamente.

**Importacoes a adicionar:**
```typescript
import { usePedidoCreation } from "@/hooks/usePedidoCreation";
import { Plus, Loader2 } from "lucide-react";
```

**Estado para controle de loading:**
```typescript
const [creatingPedido, setCreatingPedido] = useState<string | null>(null);
```

**Funcao para criar pedido:**
```typescript
const handleCriarPedido = async (vendaId: string) => {
  setCreatingPedido(vendaId);
  try {
    const pedidoId = await createPedidoFromVenda(vendaId);
    if (pedidoId) {
      // Remover venda da lista apos criar pedido
      setVendas(prev => prev.filter(v => v.id !== vendaId));
      navigate(`/administrativo/pedidos/${pedidoId}`);
    }
  } finally {
    setCreatingPedido(null);
  }
};
```

**Coluna de Acao - Alterar de:**
```tsx
<TableCell className="text-center">
  <Button variant="ghost" ...>
    <ArrowRight className="h-4 w-4" />
  </Button>
</TableCell>
```

**Para:**
```tsx
<TableCell className="text-center">
  <Button
    variant="default"
    size="sm"
    disabled={creatingPedido === venda.id}
    onClick={(e) => {
      e.stopPropagation();
      handleCriarPedido(venda.id);
    }}
    className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white"
  >
    {creatingPedido === venda.id ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : (
      <>
        <Plus className="h-3 w-3 mr-1" />
        Gerar Pedido
      </>
    )}
  </Button>
</TableCell>
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/pedidos/VendasFaturadasSemPedido.tsx` | Alterar ordenacao e adicionar botao |

## Resultado

- Lista ordenada por data decrescente (vendas mais recentes no topo)
- Botao "Gerar Pedido" em cada linha que cria o pedido de producao diretamente
- Apos criar, o usuario e redirecionado para o pedido criado
- A venda some da lista automaticamente apos criar o pedido
