

## Plano: Permitir edição da data da venda em /direcao/vendas/:id

### O que será feito

Transformar o campo "Data da Venda" na página de detalhes (`VendaDetalhesDirecao.tsx`) de texto estático para um DatePicker editável inline, permitindo que a direção altere a data diretamente na página de detalhes.

### Alterações

**Arquivo**: `src/pages/direcao/VendaDetalhesDirecao.tsx`

1. Adicionar imports: `Popover`, `PopoverTrigger`, `PopoverContent`, `Calendar` (do shadcn), `format` do date-fns, ícone `Pencil`
2. Adicionar estado `editingDate` (boolean) e lógica de atualização da data
3. Substituir o `<p>` da data da venda (linha ~466) por um Popover com Calendar para seleção de nova data
4. Ao selecionar nova data: fazer `supabase.from('vendas').update({ data_venda })` com `T12:00:00.000Z` (padrão do projeto para evitar timezone issues)
5. Atualizar o estado local `venda` e exibir toast de sucesso
6. Botão de edição (ícone lápis) ao lado da data para indicar que é editável

### Detalhe visual

O campo mostrará a data atual com um pequeno ícone de lápis. Ao clicar, abre um Popover com calendário. Ao selecionar a data, salva automaticamente.

