## Problema

Em `/vendas/minhas-vendas/nova`, ao adicionar Pintura Eletrostática, o modal `PinturaItemCatalogoModal` **obriga** o usuário a selecionar um item da venda (porta/manutenção) para vincular a pintura. Isso impede adicionar pintura como item independente — situação comum quando a venda contém apenas manutenção (sem porta com largura/altura definidas) ou quando se quer cobrar pintura avulsa.

Hoje a validação `isValid = selectedIndex !== '' && corId && Number(valorPintura) > 0` bloqueia o botão "Adicionar Pintura" enquanto nenhum item for marcado, e a busca automática de preço depende de `largura`/`altura` do item selecionado.

## Solução

Tornar a seleção do item **opcional** em `PinturaItemCatalogoModal.tsx`:

1. **Adicionar opção "Pintura avulsa (sem vincular a item)"** no topo do `RadioGroup` — quando selecionada, a pintura é criada sem descrição vinculada a outro item e sem medidas obrigatórias.
2. **Remover obrigatoriedade do `selectedIndex`** na validação: passar a exigir apenas `corId` e `valorPintura > 0`. A seleção continua disponível para quem quiser vincular a uma porta específica (mantém o cálculo automático de preço por medidas).
3. **Renderizar o modal mesmo sem itens disponíveis**: hoje, se `itensDisponiveis.length === 0`, aparece a mensagem "Nenhum item adicionado". Substituir esse bloqueio para sempre exibir os campos de cor/valor, deixando o seletor de item visível apenas quando houver itens.
4. **Ajustar `handleConfirmar`**:
   - Se nenhum item for selecionado → criar `ProdutoVenda` com `largura: 0`, `altura: 0`, `descricao: 'Pintura Eletrostática (Cor)'`.
   - Se item selecionado → manter o comportamento atual (herda medidas e descrição).
5. **Texto explicativo**: atualizar a `DialogDescription` para indicar que a vinculação a um item é opcional.

Nenhuma mudança de schema ou em outras telas — apenas UX do modal.

## Arquivo afetado

- `src/components/vendas/PinturaItemCatalogoModal.tsx` (edição única)

## Detalhes técnicos

```tsx
// Validação relaxada
const isValid = corId && Number(valorPintura) > 0;

// handleConfirmar
const idx = selectedIndex !== '' ? Number(selectedIndex) : -1;
const item = idx >= 0 ? portas[idx] : null;
const corNome = coresAtivas.find(c => c.id === corId)?.nome || '';
const baseDesc = item
  ? `${item.descricao || getLabelTipoProduto(item.tipo_produto)}`
  : 'Avulsa';
const pintura: ProdutoVenda = {
  tipo_produto: 'pintura_epoxi',
  largura: item?.largura || 0,
  altura: item?.altura || 0,
  valor_produto: Number(valorPintura) || 0,
  valor_pintura: Number(valorPintura) || 0,
  // ...
  descricao: `Pintura Eletrostática${corNome ? ` (${corNome})` : ''} - ${baseDesc}`,
  cor_id: corId || undefined,
};
```

A busca automática via `buscarPrecosPorMedidas` continua só rodando quando um item com medidas for selecionado.