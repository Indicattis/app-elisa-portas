

# Quantidade Padrao Sempre Visivel e Usada ao Adicionar Linhas

## O que muda

O campo "Quantidade padrao" deixa de ser exclusivo de itens padrao de porta de enrolar e passa a ser um campo geral de qualquer item de estoque. Quando um produto for selecionado no modal de adicionar linha ao pedido, a quantidade preenchida automaticamente sera o valor de `quantidade_padrao` do produto (ou 1 se nao definido).

## Alteracoes

### 1. `src/pages/administrativo/EstoqueEditMinimalista.tsx`

- Remover a condicao `{formData.item_padrao_porta_enrolar && (...)}` do input de quantidade padrao (linhas 307-320)
- Mover o input para fora do bloco condicional, exibindo-o sempre na secao de configuracoes de calculo
- Remover o `pl-6` (indentacao) ja que nao e mais sub-item do checkbox
- No `handleSubmit`, remover a condicao que reseta `quantidade_padrao` para 1 quando `item_padrao_porta_enrolar` e falso (linha 123)
- Manter o valor salvo sempre como `formData.quantidade_padrao`

### 2. `src/components/pedidos/AdicionarLinhaModal.tsx`

- No `handleSelecionarProduto`, substituir `quantidade: 1` por `quantidade: produto.quantidade_padrao || 1` (linha 99)
- O campo `quantidade_padrao` ja esta na interface `ProdutoEstoque`, entao nenhuma mudanca de tipo e necessaria

### Arquivos modificados

- `src/pages/administrativo/EstoqueEditMinimalista.tsx` - input sempre visivel, sem reset condicional
- `src/components/pedidos/AdicionarLinhaModal.tsx` - usar quantidade_padrao ao selecionar produto

