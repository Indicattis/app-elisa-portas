
# Plano: Separar Linhas de Pintura por Porta

## Problema Identificado

A ordem PINT-00064 foi criada sem o `produto_venda_id` nas linhas de pintura, mas essa informação EXISTE na tabela de origem (`pedido_linhas`). As linhas originais do pedido possuem:
- Porta 1 (`2dbaac84...`): 15 itens - 2.94m x 2.62m
- Porta 2 (`8fe6a751...`): 13 itens - 2.99m x 2.60m

## Solução

Modificar a lógica no frontend para buscar as linhas do pedido original (`pedido_linhas`) e fazer o match com as linhas de pintura pelo nome do item, recuperando assim o `produto_venda_id` correto.

---

## Alterações Necessárias

### Arquivo: `src/hooks/useOrdemPintura.ts`

Modificar a query para também buscar as linhas do pedido (`pedido_linhas`) e fazer o match para obter o `produto_venda_id`.

**Adicionar nova query após buscar o pedido:**
```typescript
// Buscar linhas do pedido (origem) que têm produto_venda_id
const { data: linhasPedido } = await supabase
  .from('pedido_linhas')
  .select('nome_produto, produto_venda_id, quantidade')
  .eq('pedido_id', ordem.pedido_id);
```

**Modificar o mapeamento das linhas:**
```typescript
const linhas = linhasRaw?.map((linha: any) => {
  // Se a linha já tem produto_venda_id, usar direto
  let produtoVendaId = linha.produto_venda_id;
  
  // Se não tem, buscar nas linhas originais do pedido pelo nome e quantidade
  if (!produtoVendaId && linhasPedido) {
    const linhaOriginal = linhasPedido.find((lp: any) => 
      (lp.nome_produto === linha.item || lp.nome_produto?.includes(linha.item)) &&
      lp.quantidade === linha.quantidade
    );
    produtoVendaId = linhaOriginal?.produto_venda_id;
  }
  
  // Buscar dimensões da porta
  const produtoVenda = produtos.find((p: any) => p.id === produtoVendaId);
  
  return {
    ...linha,
    item: linha.estoque?.nome_produto || linha.item,
    requer_pintura: linha.estoque?.requer_pintura ?? true,
    produto_venda_id: produtoVendaId, // Atualizado com valor correto
    largura: linha.largura || produtoVenda?.largura || null,
    altura: linha.altura || produtoVenda?.altura || null
  };
}) || [];
```

---

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

Remover o CASO 1 (visualização unificada) que adicionamos anteriormente e usar apenas o CASO 2 (agrupamento por porta), pois agora teremos os `produto_venda_id` corretos vindos do hook.

**Simplificar a lógica de agrupamento (linhas 738-836):**

Remover o bloco `if (!temAgrupamentoPorPorta && portasEnrolar.length > 0)` e manter apenas o agrupamento padrão por `produto_venda_id`.

---

## Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `src/hooks/useOrdemPintura.ts` | Buscar `pedido_linhas` e fazer match para recuperar `produto_venda_id` |
| `src/components/production/OrdemDetalhesSheet.tsx` | Remover visualização unificada, usar agrupamento por porta |

## Resultado Esperado

- PINT-00064 mostrará 2 grupos separados:
  - **Porta 01** (2.94m x 2.62m): 5 itens de pintura
  - **Porta 02** (2.99m x 2.60m): 5 itens de pintura
- Funciona tanto para ordens novas quanto legadas
