
# Copiar layout de /direcao/faturamento para /administrativo/financeiro/faturamento/vendas

## Resumo

A pagina `/administrativo/financeiro/faturamento/vendas` (`FaturamentoVendasMinimalista.tsx`) usa um layout antigo com breadcrumb manual, botao voltar flutuante e layout de coluna unica. Sera refatorada para usar o mesmo design de tres paineis da `/direcao/faturamento` (`FaturamentoDirecao.tsx`).

## Mudancas principais no `FaturamentoVendasMinimalista.tsx`

### 1. Usar MinimalistLayout com fullWidth
- Remover `AnimatedBreadcrumb` manual, `FloatingProfileMenu` e botao voltar flutuante
- Usar `MinimalistLayout` com `fullWidth`, `backPath`, e `breadcrumbItems`

### 2. Layout de 3 paineis
- **Sidebar esquerda (desktop)**: Filtros (Status com checkboxes, Vendedor select, Periodo calendario) -- substitui os filtros inline atuais
- **Area central**: Barra de busca + tabela com dot indicator de selecao e linha ativa azul
- **Sidebar direita (desktop)**: Resumo (faturamento, faturadas, pendentes, lucro liquido) + colunas manager; ao selecionar uma venda, mostra detalhes (valores por categoria, datas, botao abrir faturamento)

### 3. Mobile responsivo
- Sheets laterais para filtros e resumo (botoes Filter e PanelRight no header dos indicadores)
- Drawer (downbar) para detalhes da venda selecionada em mobile

### 4. Tabela com selecao visual
- Adicionar coluna dot indicator (circulo que fica azul ao selecionar)
- Linha selecionada com `bg-blue-500/10 border-l-2 border-l-blue-500`
- Clicar na linha seleciona a venda (mostra detalhes na sidebar direita), nao navega diretamente
- Botao "Abrir Faturamento" na sidebar direita para navegar ao faturamento

### 5. Indicadores com IndicadorExpandivel
- Substituir os cards estaticos de indicadores pelo componente `IndicadorExpandivel` (mesmo da direcao)
- Grid de 8 colunas: Portas, Pintura, Instalacoes, Acessorios, Adicionais, Fretes, Lucro Liquido, Qtd Portas
- Clicar em Portas/Pintura/Instalacoes/Acessorios/Adicionais abre drawer de ranking

### 6. Ordenacao de colunas
- Adicionar sort por clique no header (asc/desc/none) com icones ArrowUp/ArrowDown/ArrowUpDown
- Manter sortedVendas com useMemo

### 7. Manter funcionalidades existentes
- Dialog de justificativa permanece
- VendasNaoFaturadasHistorico permanece abaixo do layout principal
- Exportar PDF permanece (botao no header ou sidebar)

## Novos estados necessarios
- `selectedVenda` -- venda selecionada para detalhes
- `mobileDownbarOpen` -- drawer mobile de detalhes
- `indicadorDrawerOpen` / `indicadorAtivo` -- drawer de ranking dos indicadores
- `leftSheetOpen` / `rightSheetOpen` -- sheets mobile para filtros/resumo
- `sortConfig` -- configuracao de ordenacao
- `filtroStatus` (checkbox array) -- substituir `activeTab`
- `auxCores`, `auxAcessorios`, `auxAdicionais` -- dados auxiliares para ranking

## Componentes e imports adicionais
- `IndicadorExpandivel` de `@/components/direcao/IndicadorExpandivel`
- `Sheet`, `SheetContent`, `SheetTrigger`, `SheetTitle`
- `Drawer`, `DrawerContent`
- `ScrollArea`
- `Checkbox`
- `useIsMobile`
- `TooltipProvider`

## Arquivo modificado
1. `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` -- reescrita completa do layout mantendo a logica de dados e adaptando rotas para `/administrativo/financeiro/faturamento/`
