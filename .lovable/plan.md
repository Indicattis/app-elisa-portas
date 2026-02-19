

# Remover sistema de checkboxes Sep/Qual/Col dos pedidos

## O que sera removido

O sistema de verificacao com 3 checkboxes (Separacao, Qualidade, Coleta) nas linhas dos pedidos sera completamente eliminado da interface. Os campos continuarao existindo no banco de dados para nao quebrar dados historicos.

## Arquivos afetados

### 1. `src/components/pedidos/PedidoLinhasEditor.tsx`
- Remover a prop `todasOrdensConcluidas` da interface e do componente
- Remover a coluna de header "Checkboxes" da tabela (linha 883-885)
- Remover os checkboxes Sep/Qual/Col das linhas (linhas 634-668)
- Remover a celula vazia condicional (linhas 845-847)
- Remover o import de `Checkbox` se nao for mais usado

### 2. `src/components/pedidos/PedidoDetails.tsx`
- Remover a variavel `todosChecksMarcados` e simplificar `podedarBaixa` para depender apenas de `todasOrdensConcluidas`
- Remover o aviso amarelo que pede para marcar os checkboxes (linhas 149-154)
- Remover a prop `onAtualizarCheckbox` passada ao `PedidoLinhasEditor`
- Remover a prop `todasOrdensConcluidas` passada ao `PedidoLinhasEditor`

### 3. `src/pages/PedidoView.tsx`
- Remover os campos `check_separacao`, `check_qualidade`, `check_coleta` dos dados passados ao PDF

### 4. `src/pages/administrativo/PedidoViewMinimalista.tsx`
- Remover os campos `check_separacao`, `check_qualidade`, `check_coleta` dos dados de linhas

### 5. `src/utils/pedidoProducaoPDFGenerator.ts`
- Remover as colunas Sep/Qual/Col da tabela do PDF
- Remover a interface dos campos de check
- Remover a logica de cor verde para linhas com todos os checks marcados

### 6. `src/hooks/useVendasPedidos.ts`
- Remover os campos `check_separacao`, `check_qualidade`, `check_coleta` da interface `PedidoLinha`

### 7. `supabase/functions/popular-tiras-pedidos/index.ts`
- Remover os campos `check_separacao`, `check_qualidade`, `check_coleta` dos inserts (o banco aceita valores default)

### 8. `src/components/cadastro-instalacao/ConfirmarCarregamentoInstalacaoSheet.tsx`
- Remover referencias ao `check_coleta` -- este componente precisara ser revisado para ver se ainda faz sentido sem o checkbox

## Resultado

- A condicao para "Dar Baixa" no pedido passara a depender apenas de todas as ordens estarem concluidas
- As colunas Sep/Qual/Col desaparecerao da tabela e do PDF
- O fluxo de trabalho ficara mais simples

