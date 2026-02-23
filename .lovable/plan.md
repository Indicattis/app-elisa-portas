

# Redesenhar Contas a Pagar com o mesmo layout de Contas a Receber

## Resumo

Reescrever `ContasPagarMinimalista.tsx` para adotar o layout de 3 paineis (sidebar filtros a esquerda, tabela central plana, sidebar resumo/acoes a direita) identico ao `ContasReceberMinimalista.tsx`, substituindo o layout atual de cards resumo + agrupamento colapsavel.

## Mudancas no arquivo `src/pages/administrativo/ContasPagarMinimalista.tsx`

### Layout geral
- Remover os 4 cards de resumo no topo (Total a Pagar, Vencido, Vence Hoje, Esta Semana)
- Remover a visualizacao agrupada por `grupo_id` com `Collapsible`
- Adotar o layout flex de 3 colunas: sidebar esquerda (250px), tabela central (flex-1), sidebar direita (250px)
- Adicionar Sheet mobile para filtros (esquerda) e resumo (direita) com botoes no header

### Sidebar esquerda - Filtros
Substituir os filtros inline (Select + Input em card) por uma sidebar com checkboxes, seguindo o padrao do Contas a Receber:
- **Status**: Checkboxes para Pendente, Vencido, Pago, Cancelado (default: Pendente + Vencido marcados)
- **Categoria**: Checkboxes para cada categoria (materia_prima, servicos, utilidades, impostos, salarios, outros)
- **Forma de Pagamento**: Checkboxes para os metodos
- **Intervalo de Valor**: Dois inputs (Minimo/Maximo)
- Botao "Limpar Filtros"

### Barra de busca + data (acima da tabela)
- Input de busca por descricao/fornecedor a esquerda
- Popover de intervalo de datas a direita (mesmo componente dual-calendar do Contas a Receber)

### Tabela central plana (sem agrupamento)
Colunas:
- Checkbox de selecao
- Descricao (nome da conta)
- Fornecedor
- Historico (editavel inline via Popover, usando campo `observacoes`)
- Categoria (badge colorido)
- Vencimento (clicavel com Popover + Calendar para editar)
- Valor
- Status (badge)
- Anexo (icone Paperclip com link se houver nota_fiscal_url ou comprovante_url)
- Acoes (DropdownMenu com Marcar Pago e Excluir)

### Sidebar direita - Resumo e Acoes
- Botao "Baixar Selecionados" / "Baixar Todos" (exportacao XLSX)
- Totalizador: Quantidade e Valor Total (dinamico conforme selecao ou filtro)

### Novas funcionalidades adicionadas (alinhando com Contas a Receber)
- Selecao multipla com checkbox (select all / individual)
- Historico editavel inline (mutation `updateObservacoesMutation` no campo `observacoes`)
- Data de vencimento editavel com clique (mutation `updateVencimentoMutation`)
- Exportacao XLSX dos dados filtrados/selecionados
- Filtro padrao por status Pendente + Vencido

### Funcionalidades mantidas
- Dialog "Marcar como Pago" (ja existe)
- Mutation cancelar conta (ja existe)
- Dialog "Alterar Datas" de grupo (sera removido pois o layout plano nao tem agrupamento - a edicao individual de vencimento substitui)

### Imports a adicionar
- `Checkbox`, `DropdownMenu`, `Sheet`, `cn`, `useAllUsers` (se necessario), `XLSX`, `MoreHorizontal`, `Download`, `Filter`, `PanelRight`, `Paperclip`

### Imports a remover
- `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `ChevronDown`, `ChevronRight`, `Folder`, `Plus`, `AlertTriangle`, `Clock`

## Secao tecnica

O arquivo sera quase totalmente reescrito (~600 linhas), baseando-se na estrutura do `ContasReceberMinimalista.tsx` mas adaptado para os campos de `contas_pagar`:
- `venda?.cliente_nome` vira `fornecedor?.nome || fornecedor_nome`
- Campo `categoria` sera exibido como badge colorido
- `venda_id` nao existe; as contas sao independentes
- O `getComputedStatus` permanece igual (pendente se nao vencido, vencido se data passou)
- A query key sera `contas-pagar-min` (ja existente)

