

## Plano: Corrigir exclusão de itens, alinhar botões e adicionar edição de prazos

### Problemas identificados

1. **Exclusão não funciona visualmente**: `missaoSelecionada` é uma cópia estática no state. Quando a query invalida após o delete, o modal continua mostrando dados antigos.
2. **Botões desalinhados**: O botão de edição (Pencil) e o botão de fechar (X do Dialog) não estão alinhados verticalmente.
3. **Sem edição de prazos**: No modo edição, não há como alterar as datas de prazo dos itens.

### Alterações

#### 1. `src/pages/ChecklistLideranca.tsx`
- Em vez de guardar o objeto `missao` inteiro no state, guardar apenas o `id` da missão selecionada
- Derivar a missão atual a partir de `missoes.find(m => m.id === missaoSelecionadaId)` — assim quando a query invalida, o modal recebe dados atualizados automaticamente

#### 2. `src/components/todo/DetalhesMissaoModal.tsx`
- **Alinhamento dos botões**: Ajustar o `pr-6` do container do título para que o botão Pencil/Check fique alinhado com o X de fechar do Dialog
- **Edição de prazo**: No modo edição, adicionar um botão de calendário (CalendarIcon) ao lado de cada item que abre um Popover com Calendar para selecionar/alterar o prazo
- Chamar nova prop `onEditarPrazoCheckbox` ao selecionar data

#### 3. `src/hooks/useMissoes.ts`
- Adicionar mutation `editarPrazoCheckbox` que faz `update({ prazo }).eq('id', id)` na tabela `missao_checkboxes`

### Resultado
- Itens excluídos desaparecem imediatamente do modal
- Botões de edição e fechar ficam alinhados na mesma linha
- Usuário pode clicar no ícone de calendário em modo edição para alterar o prazo de cada item

