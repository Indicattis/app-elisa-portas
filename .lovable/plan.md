
# Correção: Identificar Porta pelo produto_venda_id (não indice_porta)

## Problema Identificado

O campo `indice_porta` indica a posição dentro de portas **do mesmo tipo** (ex: se alguém compra 2 portas iguais, elas terão índice 0 e 1). Porém, quando são portas de tipos diferentes, cada uma tem `indice_porta = 0`.

A exibição atual mostra "Porta 1" para todas as linhas porque usa diretamente `indice_porta + 1`.

## Solução

Identificar a porta com base na posição do `produto_venda_id` na lista de portas do pedido.

## Alterações Técnicas

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

**1. Buscar produtos_vendas do pedido (adicionar nova query)**

Adicionar query para buscar os `produtos_vendas` (portas) do pedido para poder enumerar corretamente:

```typescript
// Buscar portas do pedido
const { data: portasData } = await supabase
  .from('produtos_vendas')
  .select('id, largura, altura')
  .eq('venda_id', pedidoData.venda_id)
  .order('created_at', { ascending: true });

// Criar mapa de produto_venda_id -> número da porta
const portasMap = new Map<string, number>();
(portasData || []).forEach((porta, idx) => {
  portasMap.set(porta.id, idx + 1);
});
```

**2. Atualizar interface para incluir `produto_venda_id`**

```typescript
interface PedidoLinha {
  id: string;
  nome_produto: string;
  descricao_produto?: string | null;
  quantidade: number;
  tamanho?: string | null;
  indice_porta?: number | null;
  produto_venda_id?: string | null;  // ADICIONAR
}
```

**3. Atualizar query de linhas**

```typescript
.select('id, nome_produto, descricao_produto, quantidade, tamanho, indice_porta, produto_venda_id')
```

**4. Atualizar exibição do badge**

```tsx
{linha.produto_venda_id && portasMap.get(linha.produto_venda_id) && (
  <Badge variant="outline" className="...">
    Porta {portasMap.get(linha.produto_venda_id)}
    {linha.indice_porta !== null && linha.indice_porta > 0 && ` (${linha.indice_porta + 1})`}
  </Badge>
)}
```

## Lógica de Exibição

| produto_venda_id | indice_porta | Exibição |
|---|---|---|
| Porta A (1ª cadastrada) | 0 | Porta 1 |
| Porta A (1ª cadastrada) | 1 | Porta 1 (2) |
| Porta B (2ª cadastrada) | 0 | Porta 2 |

## Resultado Esperado

- Itens da primeira porta: "Porta 1"
- Itens da segunda porta: "Porta 2"
- Se uma porta tiver quantidade > 1: "Porta 1 (2)" para a segunda unidade
