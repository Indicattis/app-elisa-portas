

## Desconto contemplando Instalação no cadastro da venda

### Diagnóstico

O modal `DescontoVendaModal` já recebe **todos** os produtos do array `portas` (incluindo os de `tipo_produto: 'instalacao'`), e já permite selecionar qualquer um para aplicar desconto. Os cálculos de `valor_produto + valor_pintura + valor_instalacao` também funcionam corretamente porque para instalação, o valor está em `valor_produto` e os outros são 0.

A única lacuna é que a função `getTipoProdutoLabel` dentro do modal **não tem o case `'instalacao'`**, então o produto aparece com o tipo cru em vez de "Instalação".

### Alteração necessária

**1 arquivo: `src/components/vendas/DescontoVendaModal.tsx`**
- Adicionar `case 'instalacao': return 'Instalação';` na função `getTipoProdutoLabel` (linha ~148)

Isso é tudo — o produto de instalação já aparece na lista de seleção do modal de desconto, já é calculado corretamente na base de desconto, e já pode ser selecionado individualmente. Apenas o label está faltando.

