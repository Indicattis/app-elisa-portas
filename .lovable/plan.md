## Problema

Em `/vendas/minhas-vendas/nova`, o modal de Pintura Eletrostática ainda transmite a obrigação de selecionar/vincular um item. A opção de pintura avulsa existe, mas a implementação atual tem inconsistência de estado no `RadioGroup`: o estado interno usa `''` para “sem vínculo”, enquanto o item visual usa `value="__none__"`. Isso pode fazer a opção avulsa não ficar corretamente selecionada/entendida e manter a experiência como se fosse obrigatório escolher outro produto.

## Correção proposta

1. Padronizar o estado de seleção no modal:
   - Usar um valor explícito, por exemplo `avulsa`, para representar pintura sem vínculo.
   - Fazer o `RadioGroup` iniciar em `avulsa`.
   - Fazer a opção “Pintura avulsa (não vincular)” aparecer sempre, inclusive quando houver itens disponíveis.

2. Ajustar a lógica de confirmação:
   - Se `selectedIndex === 'avulsa'`, criar a pintura sem buscar item vinculado.
   - Se for um índice numérico, manter o vínculo com o item escolhido.

3. Ajustar a busca automática de preço:
   - Só buscar preço por medidas quando o valor selecionado for um índice numérico e o item tiver largura/altura.
   - Nunca tentar buscar preço quando a opção for avulsa.

4. Melhorar o texto visual:
   - Deixar claro que “Pintura avulsa” é a opção padrão.
   - Manter o botão “Adicionar Pintura” habilitado apenas com cor + valor preenchidos.

## Arquivo afetado

- `src/components/vendas/PinturaItemCatalogoModal.tsx`

## Resultado esperado

Na nova venda, ao clicar em “Pintura Eletrostática”, o modal abrirá já em modo avulso. O vendedor poderá selecionar a cor, informar o valor e adicionar a pintura sem selecionar manutenção, porta ou qualquer outro produto.