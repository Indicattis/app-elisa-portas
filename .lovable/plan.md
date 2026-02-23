
# Redesign da Pagina Contas a Receber

## Resumo

Reestruturar o layout da pagina `/administrativo/financeiro/caixa/contas-a-receber` com tres paineis: sidebar de filtros a esquerda, tabela principal no centro e sidebar de acoes/resumo a direita.

## Layout Geral

```text
+------------------+--------------------------------------------+------------------+
|                  |                                            |                  |
|  SIDEBAR LEFT    |           TABELA PRINCIPAL                 |  SIDEBAR RIGHT   |
|  (Filtros)       |                                            |  (Acoes/Resumo)  |
|                  |  [ ] | Hist | Pgto | Venc | Valor | St |A| |                  |
|  Status          |  ----+------+------+------+-------+----+-+ |  [Baixar Sel.]   |
|  Forma Pgto      |  [ ] | ...  | ...  | ...  | ...   |...|.| |                  |
|  Intervalo Valor |  [ ] | ...  | ...  | ...  | ...   |...|.| |  Contas: 15      |
|  Vendedor        |                                            |  Total: R$5.000  |
|                  |                                            |                  |
+------------------+--------------------------------------------+------------------+
```

Em mobile, as sidebars serao colapsaveis (Sheet ou Collapsible).

## 1. Sidebar Esquerda - Filtros

Painel fixo lateral esquerdo (largura ~250px) com os seguintes filtros empilhados verticalmente:

- **Status**: Checkboxes (Pendente, Vencido, Pago, Cancelado) - multi-selecao
- **Forma de Pagamento**: Checkboxes (PIX, Boleto, Cartao Credito, Dinheiro, etc.)
- **Intervalo de Valor**: Dois inputs (Valor minimo, Valor maximo) em reais
- **Vendedor**: Select com lista de vendedores (usando `atendente_id` da tabela `vendas` cruzado com `admin_users`)
- Botao "Limpar Filtros" no final

Os filtros atuais (busca por texto, datas, status, metodo) que estao em um Card horizontal serao removidos e migrados para essa sidebar.

## 2. Tabela Principal - Novas Colunas

Substituir a tabela atual por uma com as seguintes colunas:

| Coluna | Descricao |
|--------|-----------|
| Checkbox de selecao | Checkbox para selecionar a linha (com "selecionar todos" no header) |
| Historico | Campo editavel inline - clicar abre um input/popover para o usuario inserir uma mensagem. Salva no campo `observacoes` da tabela `contas_receber` |
| Forma de pagamento | Exibe o `metodo_pagamento` |
| Vencimento | Data de vencimento formatada dd/MM/yyyy |
| Valor | Valor da parcela formatado em BRL |
| Status | Badge colorido (Pendente, Vencido, Pago, Cancelado) |
| Anexo | Icone de clipe/paperclip. Se `comprovante_url` existir, icone preenchido/colorido; se nao, icone apagado |
| 3 pontos | DropdownMenu com opcoes: "Marcar como Pago" e "Excluir" |

## 3. Sidebar Direita - Acoes e Resumo

Painel fixo lateral direito (~250px) dividido em duas secoes:

**Secao 1 - Acoes da Selecao:**
- Botao "Baixar Selecionados" - gera e baixa um relatorio (PDF ou planilha) das contas selecionadas
- Botao fica desabilitado se nenhuma conta estiver selecionada

**Secao 2 - Informacoes:**
- Se ha contas selecionadas: mostra quantidade e valor total dos selecionados
- Se nenhuma selecionada: mostra quantidade total de contas filtradas e valor total

## Detalhes Tecnicos

### Arquivo principal: `src/pages/administrativo/ContasReceberMinimalista.tsx`

**Novos states:**
- `selectedIds: Set<string>` - IDs das contas selecionadas
- `filtroValorMin / filtroValorMax: string` - intervalo de valor
- `filtroVendedor: string` - ID do vendedor selecionado
- Converter `filtroStatus` e `filtroMetodo` de string unico para `string[]` (multi-selecao com checkboxes)

**Query de vendedores:**
- Buscar vendedores distintos das vendas relacionadas: fazer join com `admin_users` via `atendente_id` para obter nomes

**Campo Historico (observacoes):**
- Usar Popover inline na celula. Clicar abre input de texto.
- Salvar via mutation no campo `observacoes` da tabela `contas_receber`

**Coluna Anexo:**
- Exibir icone `Paperclip` com cor diferente se `comprovante_url` estiver preenchido
- Clicar abre o link do comprovante em nova aba

**Menu 3 pontos:**
- Usar `DropdownMenu` com itens "Marcar como Pago" (abre dialog existente) e "Excluir" (mutation de delete ou update status cancelado)

**Baixar Selecionados:**
- Usar `xlsx` (ja instalado) para gerar planilha com as contas selecionadas
- Colunas do export: Cliente, Forma Pagamento, Vencimento, Valor, Status

**Layout responsivo:**
- Desktop: flex com 3 colunas (sidebar left 250px + tabela flex-1 + sidebar right 250px)
- Mobile: sidebars viram Sheet (left sheet para filtros, right sheet para acoes), ativadas por botoes flutuantes ou no header

### Remocoes:
- Card de filtros horizontais atual (sera substituido pela sidebar)
- Toggle agrupado/tabela (manter apenas tabela)
- Cards de resumo do topo (Total a Receber, Vencido, etc.) serao simplificados ou movidos para a sidebar direita
