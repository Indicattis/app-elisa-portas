

## Plan: Modal de Tabela de Preços ao Clicar no Produto

### Objetivo
Ao clicar no nome do produto na tabela de itens do `VendaPendenteDetalhesSheet`, abrir um modal (Dialog) exibindo os dados da tabela de preços (`tabela_precos_portas`) correspondente às dimensões daquele produto.

### O que será feito

**Arquivo: `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`**

1. **Adicionar estado para o modal**: Um state `produtoSelecionado` que guarda o produto clicado (com suas dimensões e tipo).

2. **Tornar o nome do produto clicável**: Envolver o `<p>` do nome (linha ~472) em um botão/cursor-pointer que seta o `produtoSelecionado`.

3. **Adicionar o Dialog**: No final do componente, renderizar um `<Dialog>` que:
   - Busca na `precosTabela` (Map já existente no componente) o item correspondente às dimensões do produto.
   - Exibe os valores da tabela: `valor_porta`, `valor_pintura`, `valor_instalacao`, `lucro`, `largura`, `altura`.
   - Se não houver match na tabela (produto sem dimensões ou sem preço cadastrado), exibe mensagem "Sem preço de tabela cadastrado para este item".

4. **Imports**: Adicionar `Dialog, DialogContent, DialogHeader, DialogTitle` dos componentes UI.

### Detalhes técnicos
- O Map `precosTabela` já está populado no componente com chaves `largura.toFixed(3)-altura.toFixed(3)` — basta usar `criarChavePrecoTabela()` com as dimensões do produto clicado para buscar os dados.
- Para produtos sem dimensões (acessórios, adicionais), o modal informará que não há preço de tabela disponível.
- Layout do modal seguirá o padrão glassmorphism existente (`bg-background`, `border-white/10`).

