
# Mostrar Cor da Pintura na Coluna "Detalhes" da Tabela de Produtos

## Problema

Ao adicionar um produto do tipo `pintura_epoxi`, a coluna "Detalhes" na tabela de produtos da venda mostra "-" porque o campo `descricao` nao e preenchido com o nome da cor selecionada.

## Solucao

Preencher automaticamente o campo `descricao` do produto com o nome da cor selecionada no momento em que o produto e adicionado/salvo.

## Alteracao

### `src/components/vendas/ProdutoVendaForm.tsx`

Na funcao `handleSubmit` (por volta da linha 284), antes de chamar `onAddProduto(formData)`, resolver o nome da cor a partir do `cor_id` usando a lista de `cores` ja carregada no componente:

```
const handleSubmit = () => {
  // ... validacoes existentes ...

  const produtoFinal = { ...formData };

  // Se for pintura, incluir nome da cor na descricao
  if (produtoFinal.tipo_produto === 'pintura_epoxi' && produtoFinal.cor_id && cores) {
    const corSelecionada = cores.find(c => c.id === produtoFinal.cor_id);
    if (corSelecionada) {
      produtoFinal.descricao = corSelecionada.nome;
    }
  }

  onAddProduto(produtoFinal);
  onOpenChange(false);
};
```

Tambem aplicar a mesma logica no `PinturaRapidaModal.tsx` que adiciona pintura de forma rapida.

### `src/components/vendas/PinturaRapidaModal.tsx`

Ao montar o objeto `ProdutoVenda`, incluir o nome da cor no campo `descricao`.

## Resultado

A coluna "Detalhes" passara a exibir o nome da cor (ex: "Branco", "Preto") para produtos de pintura, em vez de "-".

## Detalhes Tecnicos

- A lista de cores (`cores`) ja esta carregada via `useQuery` no `ProdutoVendaForm`, entao nao ha consulta adicional ao banco
- O campo `descricao` ja e exibido na tabela para tipos nao-porta (linha 77 do `ProdutosVendaTable`)
- Apenas 2 arquivos modificados, sem mudanca na interface de tipos nem no banco de dados
