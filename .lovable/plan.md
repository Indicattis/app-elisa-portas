

## Plano: Corrigir edição de descrição, exclusão de itens e alinhamento de botões

### Problemas identificados

1. **Edição de descrição não persiste visualmente**: O `SortableCheckboxItem` usa `useState(cb.descricao)` internamente, que não atualiza quando props mudam. Além disso, após o blur, a query invalida e o componente pode perder o foco antes de salvar.

2. **Exclusão não funciona visualmente**: Embora a mutation rode, o `localCheckboxes` pode estar sendo sobrescrito pela re-renderização causada pela invalidação da query (o `missaoSelecionada` muda, mas o `localCheckboxes` local não sincroniza corretamente).

3. **Botões desalinhados**: O botão de edição (Pencil/Check) precisa ficar alinhado com o X de fechar do Dialog.

4. **View mode usa SortableCheckboxItem sem DndContext**: Pode causar erros silenciosos.

### Alterações

#### `src/components/todo/DetalhesMissaoModal.tsx`

1. **Separar componente de view e edit**: No modo visualização, renderizar um componente simples (sem `useSortable`) em vez do `SortableCheckboxItem`. Isso elimina o problema de `useSortable` sem `DndContext`.

2. **Sincronizar `localCheckboxes` com dados do servidor**: Adicionar um `useEffect` que atualiza `localCheckboxes` quando `missao.missao_checkboxes` muda E `editando` é true — mas apenas para mudanças vindas do servidor (delete/prazo), preservando edições locais de descrição em andamento.

3. **Usar `key` com descrição no Input**: Forçar re-mount do Input quando a descrição muda no servidor, garantindo que `localDescricao` reflita o estado correto.

4. **Alinhar botões**: Ajustar posicionamento do botão Pencil/Check para ficar na mesma linha e alinhado com o X do Dialog — usar `absolute right-10 top-3` ou flexbox adequado no header.

5. **Adicionar `onPointerDown={e => e.stopPropagation()}` no Input e no botão X**: Evita que o dnd-kit intercepte cliques nesses elementos.

### Resultado
- Edição de descrição funciona e salva ao blur/enter
- Exclusão remove o item imediatamente e persiste
- Drag-and-drop funciona sem conflito com inputs/botões
- Botões alinhados corretamente no header

