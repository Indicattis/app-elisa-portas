

## Plano: Corrigir preço de tabela para Pintura e condicionar Instalação

### Problemas identificados

1. **Pintura Epóxi com preço de tabela R$ 0,00**: O código usa `produto.valor_produto` como preço de tabela, mas para pintura o valor fica em `valor_pintura` (e `valor_produto` é sempre 0). O preço de tabela da pintura deve ser buscado na `tabela_precos_portas` usando as dimensões (largura/altura) da pintura — coluna `valor_pintura`.

2. **Porta de Enrolar inclui instalação sempre**: O preço de tabela da porta deve incluir `valor_instalacao` da tabela de preços **somente se** a modalidade da venda for `instalacao`. Caso contrário, usar apenas `valor_porta`.

### Alterações

**`src/components/pedidos/VendaPendenteDetalhesSheet.tsx`**

- Na query de `fetchVendaCompleta`, já temos `largura`, `altura` e `valor_pintura` dos produtos. Também temos acesso a `vendaCompleta.tipo_entrega`.

- Após carregar a venda, buscar os preços de tabela para itens de porta/pintura via `buscarPrecosPorMedidas` (já existe em `utils/tabelaPrecosHelper.ts`). Armazenar num Map por dimensões para evitar chamadas duplicadas.

- Na renderização da tabela de itens:
  - **Porta de Enrolar**: `precoTabela = tabelaPreco.valor_porta + (tipoEntrega === 'instalacao' ? tabelaPreco.valor_instalacao : 0)`
  - **Pintura Epóxi**: `precoTabela = tabelaPreco.valor_pintura` (buscado da mesma tabela, mesmas dimensões da porta associada)
  - **Outros tipos** (acessório, adicional, etc.): manter `produto.valor_produto` como preço de tabela

### Detalhes técnicos

- Importar `buscarPrecosPorMedidas` de `@/utils/tabelaPrecosHelper`
- Criar estado `precosTabela` como `Map<string, ItemTabelaPreco>` indexado por `${largura}-${altura}`
- No `fetchVendaCompleta`, após receber os produtos, extrair dimensões únicas e buscar preços em paralelo
- O `tipo_entrega` vem de `vendaCompleta.tipo_entrega` (valores: `'instalacao'` ou `'entrega'`)

### Escopo
- 1 arquivo modificado: `VendaPendenteDetalhesSheet.tsx`

