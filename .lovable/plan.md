

# Correção: Numerar Portas Baseado nas Linhas do Pedido

## Problema

A query atual busca **todos** os `produtos_vendas` da venda, mas nem todos são portas do pedido. As linhas do pedido referenciam apenas 2 produtos (o 3º e 4º da lista), resultando em "Porta 3" e "Porta 4" ao invés de "Porta 1" e "Porta 2".

## Solução

Criar o mapa de numeração baseado nos `produto_venda_id` únicos que existem nas linhas do pedido, não em todos os produtos da venda.

## Alterações Técnicas

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

**Linhas 93-106 - Alterar lógica de criação do mapa:**

```typescript
// ANTES: Busca TODOS os produtos da venda
if (pedidoData.venda_id) {
  const { data: portasData } = await supabase
    .from('produtos_vendas')
    .select('id')
    .eq('venda_id', pedidoData.venda_id)
    .order('created_at', { ascending: true });

  const newPortasMap = new Map<string, number>();
  (portasData || []).forEach((porta, idx) => {
    newPortasMap.set(porta.id, idx + 1);
  });
  setPortasMap(newPortasMap);
}

// DEPOIS: Usa apenas os produto_venda_id únicos das linhas do pedido
const uniquePortaIds = [...new Set(
  (linhasData || [])
    .map(l => l.produto_venda_id)
    .filter((id): id is string => id !== null && id !== undefined)
)];

const newPortasMap = new Map<string, number>();
uniquePortaIds.forEach((portaId, idx) => {
  newPortasMap.set(portaId, idx + 1);
});
setPortasMap(newPortasMap);
```

## Resultado

| produto_venda_id nas linhas | Numeração |
|-----------------------------|-----------|
| 8fe6a751-... (1º encontrado) | Porta 1 |
| 2dbaac84-... (2º encontrado) | Porta 2 |

Os itens agora exibirão "Porta 1" e "Porta 2" corretamente.

