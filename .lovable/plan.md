
# Correcao: Erro ao Adicionar Item de Catalogo na Edicao de Venda

## Problema Identificado

Ao adicionar um item do catalogo na pagina de edicao de venda (`/direcao/vendas/:id/editar`), o campo `unidade` e enviado na insercao mas **nao existe** na tabela `produtos_vendas`. Isso causa um erro silencioso no Supabase que impede a criacao do produto.

O fluxo do problema:
1. O `SelecionarAcessoriosModal` retorna produtos com o campo `unidade` (ex: "Unitario", "Metro")
2. O `VendaEditarDirecao` chama `addProduto({ ...produto, venda_id: id })`
3. O hook `useProdutosVenda` faz spread de todos os campos no insert: `{ ...produto }`
4. O Supabase rejeita o insert porque a coluna `unidade` nao existe em `produtos_vendas`

Itens do tipo `porta_enrolar` funcionam normalmente porque nao possuem o campo `unidade`.

## Correcao

### Arquivo: `src/hooks/useProdutosVenda.ts`

Remover campos que nao pertencem a tabela `produtos_vendas` antes do insert. Adicionar uma limpeza explicita para excluir `unidade` e qualquer outro campo extra.

```typescript
// Dentro do mutationFn do addProdutoMutation (linha 32-53)
mutationFn: async (produto: ProdutoVenda & { venda_id: string }) => {
  // Remover campos que nao existem na tabela produtos_vendas
  const { unidade, ...produtoSemExtra } = produto as any;
  
  const produtoLimpo = {
    ...produtoSemExtra,
    tamanho: produtoSemExtra.tamanho || (produtoSemExtra.largura && produtoSemExtra.altura ? `${produtoSemExtra.largura}x${produtoSemExtra.altura}` : ''),
    largura: produtoSemExtra.largura || null,
    altura: produtoSemExtra.altura || null,
    cor_id: produtoSemExtra.cor_id || null,
    acessorio_id: produtoSemExtra.acessorio_id || null,
    adicional_id: produtoSemExtra.adicional_id || null,
    vendas_catalogo_id: produtoSemExtra.vendas_catalogo_id || null,
    descricao: produtoSemExtra.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : (produtoSemExtra.descricao || null),
  };

  const { data, error } = await supabase
    .from('produtos_vendas')
    .insert([produtoLimpo])
    .select()
    .single();

  if (error) throw error;
  return data;
},
```

### Resultado Esperado

- Itens do catalogo serao adicionados corretamente na edicao de venda
- O campo `unidade` sera descartado antes da insercao no banco
- Nenhuma alteracao no banco de dados necessaria
- Apenas 1 arquivo modificado: `src/hooks/useProdutosVenda.ts`
