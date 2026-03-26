

## Plano: Exibir apenas itens e valor de correção para pedidos de correção

### Problema
Em `/direcao/pedidos/:id`, quando o pedido é de correção (`is_correcao = true`), a página exibe os produtos da venda original e os itens do pedido normalmente. O correto seria exibir apenas os itens de correção (da tabela `correcao_linhas`) e o valor da correção (`custo_correcao` da tabela `correcoes`).

### Solução
Alterar `src/pages/direcao/PedidoViewDirecao.tsx`:

**1. Buscar `is_correcao` e `pedido_origem_id` no fetch do pedido** (linha 150-156) — adicionar esses campos ao select.

**2. Buscar dados de correção quando `is_correcao = true`** — após o fetch principal, consultar `correcoes` (filtrando por `pedido_id`) para obter `custo_correcao`, `setor_causador`, `justificativa`, `etapa_causadora`, e consultar `correcao_linhas` para os itens.

**3. Renderização condicional:**
- Se `is_correcao`: ocultar a seção "Produtos da Venda" e "Itens do Pedido", e em seu lugar exibir:
  - Card "Itens da Correção" com a lista de `correcao_linhas` (descrição + quantidade)
  - Substituir "Valor da Venda" por "Valor da Correção" (`custo_correcao`)
  - Exibir `setor_causador`, `etapa_causadora` e `justificativa` se preenchidos
  - Badge "CORREÇÃO" no header (roxo, similar ao PedidoCard)
- Se não for correção: manter tudo como está

### Arquivo alterado
- `src/pages/direcao/PedidoViewDirecao.tsx`

