
# Mover observacoes e "Marcar como Pago" da listagem para a pagina de detalhe

## O que sera feito

1. **Remover** da sidebar direita do `FaturamentoVendasMinimalista.tsx` (listagem de vendas): o campo textarea de observacoes e o botao "Marcar como Pago" em cada parcela. Manter apenas a exibicao de status, data de vencimento e metodo de pagamento.

2. **Adicionar** na pagina de detalhe `FaturamentoVendaMinimalista.tsx` (pagina individual da venda) uma nova secao "Parcelas / Contas a Receber" com:
   - Busca das parcelas da tabela `contas_receber` vinculadas a venda
   - Exibicao de cada parcela com status, vencimento, valor e metodo de pagamento
   - Campo textarea para observacoes (editavel inline com onBlur)
   - Botao "Marcar como Pago" para parcelas pendentes

## Detalhes tecnicos

### Arquivo 1: `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`

**Remover nas linhas 966-987** (dentro do bloco de renderizacao de cada pagamento na sidebar):
- O `<textarea>` de observacoes (linhas 966-977)
- O bloco condicional `{!isPago && (...)}` com o botao "Marcar como Pago" (linhas 978-987)

Resultado: cada parcela na sidebar exibira apenas status badge, data de vencimento e metodo de pagamento (somente leitura).

### Arquivo 2: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**1. Adicionar estado e fetch de contas a receber:**
- Novo estado: `contasReceber` (array de parcelas)
- Novo `useEffect` que busca `contas_receber` filtrado por `venda_id = id`, ordenado por `numero_parcela`
- Campos buscados: `id, venda_id, metodo_pagamento, data_vencimento, status, observacoes, data_pagamento, valor_parcela, numero_parcela`

**2. Adicionar funcao `handleUpdatePagamento`:**
- Mesma logica do arquivo de listagem: atualiza `status` ou `observacoes` na tabela `contas_receber`
- Quando `status = 'pago'`, tambem define `data_pagamento` com a data atual
- Atualiza o estado local para refletir a mudanca sem recarregar

**3. Adicionar nova secao "Parcelas" na UI (abaixo da tabela de produtos, antes dos botoes de acao):**

```text
Card "Parcelas / Contas a Receber"
  - Para cada parcela:
    - Linha com: numero da parcela, valor, vencimento, metodo, status badge
    - Textarea para observacoes (onBlur salva)
    - Botao "Marcar como Pago" (se pendente)
```

O visual seguira o mesmo padrao dark (bg-white/5, border-white/10) ja usado na pagina.

### Arquivos alterados

1. `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` - Remover textarea e botao da sidebar
2. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` - Adicionar secao de parcelas com observacoes e baixa de pagamento
