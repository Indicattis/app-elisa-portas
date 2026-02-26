

# Adicionar "Excluir Selecionados" na pagina Contas a Receber

## O que sera feito

Adicionar um botao "Excluir Selecionados" na secao de Acoes da sidebar direita da pagina `/administrativo/financeiro/caixa/contas-a-receber`. O botao so aparece quando ha itens selecionados e pede confirmacao antes de excluir.

## Mudancas

### Arquivo: `src/pages/administrativo/ContasReceberMinimalista.tsx`

1. **Importar `Trash2`** do lucide-react e componentes de `AlertDialog` para confirmacao
2. **Adicionar estado** `confirmDeleteOpen` para controlar o dialog de confirmacao
3. **Criar mutation `deletarSelecionadosMutation`** que deleta da tabela `contas_receber` todos os registros cujos IDs estao em `selectedIds`, invalida a query e limpa a selecao
4. **Adicionar botao na sidebar direita** (secao "Acoes", abaixo do botao de exportar):
   - Visivel apenas quando `selectedIds.size > 0`
   - Estilo destrutivo (vermelho)
   - Texto: "Excluir Selecionados (N)"
   - Ao clicar, abre AlertDialog de confirmacao
5. **Renderizar AlertDialog** com mensagem "Tem certeza que deseja excluir N parcelas selecionadas? Esta acao nao pode ser desfeita." e botoes Cancelar/Excluir

