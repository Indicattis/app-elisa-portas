
# Corrigir contagem de etiquetas no modal "Imprimir Todas"

## Problema

O modal de "Imprimir Etiquetas" busca dados da tabela `pedido_linhas` (todas as 30 linhas do pedido), mas a ordem de separacao OSE-2026-0052 tem apenas 20 linhas na tabela `linhas_ordens`. O modal deveria mostrar apenas as linhas da ordem especifica, nao todas as linhas do pedido.

## Solucao

Modificar o `ImprimirEtiquetasModal` para aceitar opcionalmente um `ordemId` e, quando fornecido, buscar as linhas de `linhas_ordens` em vez de `pedido_linhas`.

### Alteracoes

**Arquivo 1: `src/components/ordens/ImprimirEtiquetasModal.tsx`**

1. Adicionar props opcionais `ordemId` na interface
2. Quando `ordemId` estiver presente, buscar de `linhas_ordens` filtrando por `ordem_id` e `tipo_ordem`, mapeando os campos (`item` -> `nome_produto`, etc.)
3. Quando `ordemId` nao estiver presente, manter o comportamento atual (buscar de `pedido_linhas`) -- para uso em outros contextos como `OrdensAccordion`

**Arquivo 2: `src/components/production/OrdemDetalhesSheet.tsx`**

1. Passar `ordemId={ordem.id}` ao `ImprimirEtiquetasModal`

### Detalhes tecnicos

Na query condicional dentro do modal:

```typescript
// Se ordemId fornecido, buscar linhas da ordem especifica
if (ordemId) {
  const { data, error } = await supabase
    .from('linhas_ordens')
    .select('id, item, quantidade, largura, altura, tamanho, estoque:estoque_id(nome_produto)')
    .eq('ordem_id', ordemId)
    .eq('tipo_ordem', tipoOrdem)
    .order('created_at', { ascending: true });

  // Mapear para LinhaItem
  return data.map(l => ({
    id: l.id,
    nome_produto: l.estoque?.nome_produto || l.item,
    descricao_produto: l.item,
    quantidade: l.quantidade,
    largura: l.largura,
    altura: l.altura,
    tamanho: l.tamanho,
  }));
}

// Senao, buscar todas as linhas do pedido (comportamento atual)
```

Isso garante que o botao "Imprimir Todas" mostre exatamente as 20 etiquetas da ordem de separacao, e nao as 30 do pedido inteiro.
