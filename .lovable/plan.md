

# Refazer sessao de vendas faturadas com design minimalista

## Objetivo

Redesenhar a secao de listagem de vendas em `/direcao/faturamento` para seguir o mesmo design minimalista usado em `/administrativo/financeiro/caixa/contas-a-receber`, com layout de 3 paineis (filtros a esquerda, tabela central, resumo a direita).

## Mudancas

### 1. Layout de 3 paineis

Substituir o layout atual (filtros em linha + tabela) por um layout `flex gap-4` com:

- **Sidebar esquerda (250px)**: Filtros de Status (Todas/Faturadas/Nao Faturadas), Vendedor, e periodo de datas. Estilo: `rounded-xl bg-white/5 border border-white/10` com checkboxes e selects minimalistas
- **Area central (flex-1)**: Barra de busca com campo de texto + tabela de vendas
- **Sidebar direita (250px)**: Resumo com Faturamento total, quantidade faturadas/pendentes, lucro liquido. Botao de exportar XLSX e gerenciador de colunas

### 2. Estilizacao da tabela

Trocar o wrapper da tabela de `bg-primary/5 border border-primary/10` para `bg-white/5 border border-white/10 rounded-xl overflow-hidden`, igual ao Contas a Receber. Bordas das rows: `border-white/10`.

### 3. Cards de estatisticas

Remover os 3 cards de estatisticas no topo (Faturamento, Faturadas, Pendentes) pois essas informacoes estarao na sidebar direita de resumo.

### 4. Tabs e filtros inline

Remover as Tabs (Todas/Faturadas/Nao Faturadas) e o filtro inline (busca + calendario + vendedor + column manager). Tudo isso sera movido para as sidebars:
- Filtros de status, vendedor -> sidebar esquerda com checkboxes
- Busca por texto -> barra acima da tabela
- Seletor de datas -> sidebar esquerda
- Column Manager -> sidebar direita

### 5. Responsividade mobile

Adicionar Sheet (drawer) para as sidebars em telas < lg, com botoes Filter e PanelRight no header, igual ao Contas a Receber.

### 6. Indicadores do periodo

Manter a secao de indicadores como esta (acima da area de 3 paineis), apenas trocando o Card wrapper para `rounded-xl bg-white/5 border border-white/10` para consistencia visual.

## Detalhes tecnicos

**Arquivo editado:** `src/pages/direcao/FaturamentoDirecao.tsx`

**Imports a adicionar:**
- `Sheet, SheetContent, SheetTrigger, SheetTitle` de `@/components/ui/sheet`
- `Checkbox` de `@/components/ui/checkbox`
- `Filter, PanelRight` de `lucide-react`

**Imports a remover:**
- `Tabs, TabsList, TabsTrigger`
- `CardHeader, CardTitle` (se nao usados nos indicadores)

**Estrutura do JSX:**
```text
MinimalistLayout (fullWidth)
  +-- Indicadores do Periodo (bg-white/5)
  +-- flex gap-4
      +-- aside.left (filtros: status checkboxes, vendedor select, date range)
      +-- main (search input + tabela)
      +-- aside.right (resumo stats + export + column manager)
```

**Estado a alterar:**
- Remover `activeTab` -- substituir por `filtroStatus: string[]` com checkboxes (["faturadas", "nao_faturadas"])
- Adaptar `filteredVendas` para usar o novo array de filtro de status

**Sidebar esquerda (filterContent):**
- Secao "Status" com 3 checkboxes: Todas, Faturadas, Nao Faturadas
- Secao "Vendedor" com Select
- Secao "Periodo" com seletor de datas (mover o Popover de calendario para ca)
- Botao "Limpar Filtros"

**Sidebar direita (rightContent):**
- Resumo: Faturamento total, Faturadas (count), Pendentes (count), Lucro Liquido
- ColumnManager
- Botao exportar (futuro, se necessario)

