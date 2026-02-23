
# Editar Data de Vencimento com Clique

## Resumo

Tornar a coluna "Vencimento" clicavel, abrindo um Popover com um Calendar para alterar a data de vencimento diretamente na tabela.

## Mudancas

**Arquivo:** `src/pages/administrativo/ContasReceberMinimalista.tsx`

### Nova mutation
Criar `updateVencimentoMutation` para atualizar `data_vencimento` no banco:
- Faz `supabase.from('contas_receber').update({ data_vencimento }).eq('id', id)`
- Invalida query e exibe toast de sucesso

### Alterar celula de Vencimento (linha ~699)
Substituir o `TableCell` simples por um `Popover` com `Calendar`, seguindo o mesmo padrao ja usado no campo "Historico":
- O texto da data funciona como botao/trigger (com hover visual para indicar que e clicavel)
- Ao clicar, abre um Popover com Calendar no modo `single`
- Ao selecionar uma data, chama a mutation e fecha o popover
- O calendario usa `locale={ptBR}` e `pointer-events-auto`

### Layout visual
A data aparece com estilo de hover (`hover:text-purple-300 cursor-pointer`) para indicar que e editavel, similar ao campo Historico.
