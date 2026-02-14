

# Atualizar pagina de Almoxarifado para igualar layout da Fabrica

## Resumo
Redesenhar a pagina `/direcao/estoque/configuracoes/produtos/almoxarifado` para seguir exatamente o mesmo layout e design da pagina de Fabrica, incluindo barra de busca, indicadores, tabela com footer de totais e estilizacao consistente.

## Alteracoes no arquivo `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx`

### 1. Adicionar barra de busca com indicadores
- Adicionar estado `searchTerm` para filtro de busca
- Adicionar bloco de indicadores identico ao da Fabrica:
  - **Valor Estoque** (verde) - soma de `total_estoque` dos itens
  - **Itens** (azul) - quantidade de itens filtrados
  - **Estoque Baixo** (vermelho) - itens com `quantidade_estoque < quantidade_minima`
  - **Em Excesso** (amarelo) - itens com `quantidade_estoque > quantidade_maxima`
- Importar icones `DollarSign`, `Package`, `AlertTriangle`, `TrendingUp`

### 2. Reformular estrutura da tabela
- Adicionar coluna **Fornecedor** (ja disponivel no join do hook)
- Manter colunas: Produto (com descricao se houver), Fornecedor, Est. Min, Est. Max, Atual (com Badge colorido), Preco/Un, Valor Total, Acoes
- Estilizar headers com `text-xs font-medium text-white/60`
- Adicionar **footer** com totais (ideal, maxima, atual, valor)

### 3. Ajustar design dos cards
- Usar mesma estrutura de cards: `p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10`
- Separar barra de busca/indicadores do bloco da tabela (dois cards)
- Adicionar texto de dica: "Dica: Clique em editar para modificar o item."

### 4. Logica de filtragem e totais
- Filtrar itens pelo `searchTerm` (busca por nome)
- Calcular totais via `useMemo` filtrando itens visiveis
- Usar mesma logica de cores nos Badges de quantidade

### 5. Simplificar coluna Acoes
- Manter apenas botao de excluir (icone Trash2) com `confirm()` direto, sem AlertDialog separado
- Remover botao de editar (manter duplo clique ou remover edicao inline por enquanto)

### 6. Importacoes adicionais
- Adicionar: `useMemo` do React
- Adicionar icones: `DollarSign`, `Package`, `TrendingUp`
- Remover: `AlertDialog` (usar `confirm()` nativo), `Pencil`
- Adicionar: `TableFooter`

### Arquivo alterado
- `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx`

