

## Plano: Destacar produtos da venda em roxo para pedidos de correção

### Situação atual
Quando o pedido é de correção, a seção "Produtos da Venda" é **ocultada** e substituída apenas pelos itens de correção. O usuário quer ver os produtos da venda também, mas destacados em roxo.

### Solução
Alterar `src/pages/direcao/PedidoViewDirecao.tsx` para que, quando `is_correcao = true`:

1. **Exibir ambas as seções** — "Produtos da Venda" + "Itens da Correção" (em vez de ocultar os produtos)
2. **Estilizar o card de Produtos da Venda com tema roxo** — borda e fundo roxo (`bg-purple-500/5 border-purple-500/20`), ícone roxo, similar aos cards de correção já existentes
3. **Destacar as linhas da tabela** com tom roxo sutil (`hover:bg-purple-500/10`, bordas `border-purple-500/10`)

### Detalhes técnicos
- Remover o bloco condicional que esconde os produtos da venda quando `is_correcao`
- Mover a seção "Produtos da Venda" para fora do `if/else`, aplicando classes roxas condicionalmente com `cn()`
- Manter os cards de "Itens da Correção" e "Detalhes da Correção" apenas para correções

### Arquivo alterado
- `src/pages/direcao/PedidoViewDirecao.tsx`

