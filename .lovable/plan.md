

# Nova Visualizacao em Tabela para Contas a Receber

## Resumo

Adicionar um botao de alternancia de visualizacao na pagina de Contas a Receber. A visualizacao atual (agrupada por cliente) sera mantida, e uma nova visualizacao em tabela plana sera adicionada, listando todas as contas individualmente em ordem de data.

## Alteracoes (arquivo unico)

**Arquivo:** `src/pages/administrativo/ContasReceberMinimalista.tsx`

### 1. Novo estado para controle de visualizacao

Adicionar estado `visualizacao` com valores `'agrupado'` e `'tabela'`, default `'agrupado'`.

### 2. Botoes de alternancia

Acima da area de listagem (entre filtros e a Card de conteudo), renderizar dois botoes (toggle) para alternar entre "Agrupado" e "Tabela". Usar icones `Folder` e `List` do lucide-react.

### 3. Nova visualizacao em tabela

Quando `visualizacao === 'tabela'`, exibir uma tabela com as `contasFiltradas` ordenadas por `data_vencimento`, com as colunas:

| Data Criacao | Cliente | Metodo Pagamento | Valor | Status | Acoes |
|---|---|---|---|---|---|

- **Data Criacao**: `created_at` da conta (precisa ser incluido na query - ja existe na tabela `contas_receber`)
- **Cliente**: nome do cliente via join com vendas
- **Metodo Pagamento**: formatado (boleto, PIX, etc.)
- **Valor**: valor da parcela formatado em BRL
- **Status**: badge colorido (mesmo `getStatusBadge` ja existente)
- **Acoes**: mesmos botoes de marcar pago/cancelar

### 4. Ajuste na query

Adicionar o campo `created_at` no select da query de `contas_receber` (atualmente usa `select('*')` entao ja vem, so precisa tipar na interface `ContaReceber`).

### 5. Interface ContaReceber

Adicionar `created_at: string` a interface.

## Resultado esperado

- Botao de alternancia visivel entre filtros e listagem
- Visualizacao "Agrupado": comportamento atual mantido intacto
- Visualizacao "Tabela": lista plana ordenada por data de vencimento, com todas as colunas solicitadas e acoes funcionais

