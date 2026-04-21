

## Aba "Catálogo" em Tabela de Preços

Adicionar uma segunda aba na página `/direcao/vendas/tabela-precos` permitindo editar **preço de venda** e **custo do produto** dos itens cadastrados em `/vendas/catalogo`.

### Estrutura

A página atual ganha um `Tabs` no topo com duas abas:

1. **Portas** — todo o conteúdo atual (pesquisa rápida + tabela de itens da tabela de preços de portas).
2. **Catálogo** — nova aba com listagem dos produtos do `vendas_catalogo` (ativos), em tabela enxuta com edição inline de **Preço de Venda** e **Custo**.

```text
[ Portas ] [ Catálogo ]
─────────────────────────────────────────────
Catálogo
─────────────────────────────────────────────
Imagem | Produto | Categoria | SKU | Custo (editável) | Preço Venda (editável) | Margem | Estoque
```

### Comportamento

- Reaproveita `useVendasCatalogo` (já existente) para listar e `editarProduto` para salvar.
- Edição inline igual ao padrão atual do "Lucro" em portas: clicar no valor abre input, Enter salva, Esc cancela.
- Margem (%) calculada localmente: `(preco_venda - custo_produto) / preco_venda * 100`.
- Busca por nome/SKU acima da tabela.
- Sem criação/exclusão nesta aba — para isso o usuário continua usando `/vendas/catalogo`.

### Fora de escopo

- Não altera `/vendas/catalogo`.
- Não muda permissões/RLS — quem já edita `vendas_catalogo` continua editando.
- Não altera campos além de `custo_produto` e `preco_venda`.

### Arquivos

- `src/pages/TabelaPrecos.tsx` — envolver conteúdo atual em `<Tabs>` e adicionar aba "Catálogo".
- `src/components/tabela-precos/CatalogoPrecosTab.tsx` (novo) — componente da nova aba, usa `useVendasCatalogo`.

