

# Correção: Match Preciso de Linhas de Pintura com Portas

## Problema Identificado

As `linhas_ordens` de pintura têm `pedido_linha_id` e `produto_venda_id` **nulos**. O match atual usa apenas nome+quantidade, que é **ambíguo** quando existem itens idênticos em portas diferentes.

**Exemplo do pedido atual:**
| Item | Qtd | Tamanho | Porta |
|------|-----|---------|-------|
| Meia cana lisa | 35 | 2,85 | 1 |
| Meia cana lisa | 35 | 2,80 | 2 |
| Meia cana lisa | 6 | 3,09 | 1 |
| Meia cana lisa | 6 | 3,04 | 2 |

O match por nome+quantidade retorna o **primeiro** resultado encontrado, agrupando todos os itens na mesma porta incorretamente.

## Solução

Usar associação sequencial: quando múltiplas linhas do pedido combinam com uma linha de pintura, "consumir" cada match conforme são encontrados, evitando repetições.

## Alterações Técnicas

### Arquivo: `src/hooks/useOrdemPintura.ts`

**Substituir lógica de match (linhas 96-132):**

```typescript
// Processar linhas - usar match sequencial para evitar associações duplicadas
const linhasPedidoUsadas = new Set<string>();

const linhas = linhasRaw?.map((linha: any) => {
  // Se a linha já tem produto_venda_id, usar direto
  let produtoVendaId = linha.produto_venda_id;
  let linhaOriginal = null;
  
  // Se não tem, buscar nas linhas originais do pedido
  if (!produtoVendaId && linhasPedido) {
    // Encontrar TODAS as linhas que combinam
    const linhasMatch = linhasPedido.filter((lp: any) => 
      !linhasPedidoUsadas.has(lp.id) && // Ainda não usada
      (lp.nome_produto === linha.item || 
       lp.nome_produto?.includes(linha.item) || 
       linha.item?.includes(lp.nome_produto) ||
       linha.estoque?.nome_produto === lp.nome_produto) &&
      lp.quantidade === linha.quantidade
    );
    
    // Se encontrou, usar a primeira NÃO USADA e marcar como usada
    if (linhasMatch.length > 0) {
      linhaOriginal = linhasMatch[0];
      linhasPedidoUsadas.add(linhaOriginal.id);
      produtoVendaId = linhaOriginal.produto_venda_id;
    }
  } else if (linhasPedido) {
    // Se já tem produto_venda_id, ainda buscar linha original para tamanho
    linhaOriginal = linhasPedido.find((lp: any) => 
      !linhasPedidoUsadas.has(lp.id) &&
      lp.produto_venda_id === produtoVendaId &&
      (lp.nome_produto === linha.item || 
       lp.nome_produto?.includes(linha.item) || 
       linha.item?.includes(lp.nome_produto) ||
       linha.estoque?.nome_produto === lp.nome_produto) &&
      lp.quantidade === linha.quantidade
    );
    if (linhaOriginal) {
      linhasPedidoUsadas.add(linhaOriginal.id);
    }
  }
  
  // Buscar dimensões da porta
  const produtoVenda = produtos.find((p: any) => p.id === produtoVendaId);

  return {
    ...linha,
    item: linha.estoque?.nome_produto || linha.item,
    requer_pintura: linha.estoque?.requer_pintura ?? true,
    produto_venda_id: produtoVendaId,
    largura: linha.largura || produtoVenda?.largura || null,
    altura: linha.altura || produtoVenda?.altura || null,
    tamanho: linha.tamanho || linhaOriginal?.tamanho || null
  };
}) || [];
```

## Como Funciona

1. Cria um `Set` para rastrear quais `pedido_linhas.id` já foram usadas
2. Para cada linha de pintura, busca matches que ainda não foram usados
3. Ao encontrar um match, marca o `id` como usado
4. Isso garante associação sequencial: primeira linha de pintura → primeira linha de pedido, segunda → segunda, etc.

## Resultado Esperado

| Linha Pintura | Match Anterior | Match Corrigido |
|--------------|----------------|-----------------|
| Meia cana qtd 35 (1ª) | Porta 1 | Porta 1 |
| Meia cana qtd 35 (2ª) | Porta 1 ❌ | Porta 2 ✅ |
| Meia cana qtd 6 (1ª) | Porta 1 | Porta 1 |
| Meia cana qtd 6 (2ª) | Porta 1 ❌ | Porta 2 ✅ |

As linhas serão associadas corretamente às suas respectivas portas.

