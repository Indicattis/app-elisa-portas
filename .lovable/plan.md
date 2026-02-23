

# Atalhos Rapidos na Home + Paginas Read-Only

## Resumo

Adicionar uma secao de "Acesso Rapido" na pagina /home com 2 botoes:
1. **Pedidos em Producao** - abre pagina read-only clone de /fabrica/pedidos-producao (somente pedidos, sem ranking PortasPorEtapa)
2. **Calendario Expedicao** - abre pagina read-only clone de /logistica/expedicao (somente calendario, sem listagem de pedidos por etapa)

Ambas as paginas serao somente leitura, sem possibilidade de alterar dados.

## 1. Criar pagina PedidosProducaoReadOnly

**Arquivo:** `src/pages/home/PedidosProducaoReadOnly.tsx`

Clone simplificado de `PedidosProducaoMinimalista.tsx`:
- Manter: Tabs de etapas, filtros, listagem paginada de pedidos, Neo Instalacoes e Correcoes
- Remover: componente `PortasPorEtapa` (ranking de desempenho por etapa)
- Remover: botao de atribuir responsavel, modal de responsavel
- Read-only: passar callbacks vazios (noop) para `onMoverEtapa`, `onRetrocederEtapa`, `onReorganizar`, `onArquivar`, `onDeletar`
- Desabilitar drag-and-drop (`enableDragAndDrop={false}`)
- Ocultar botoes de acao nos cards (usar props `disableActions` / `hideStatusColumns` ja existentes no PedidoCard)
- Breadcrumb: Home > Pedidos em Producao
- BackPath: `/home`

## 2. Criar pagina CalendarioExpedicaoReadOnly

**Arquivo:** `src/pages/home/CalendarioExpedicaoReadOnly.tsx`

Clone simplificado de `ExpedicaoMinimalista.tsx`:
- Manter: Calendario (mensal e semanal), navegacao de datas, filtro por legenda, visualizacao de ordens/instalacoes/correcoes
- Remover: toda a secao de listagem de pedidos por etapa (Tabs com aguardando coleta, instalacoes, correcoes, finalizado)
- Remover: botao "Novo Neo", botao de logout
- Remover: modais de edicao, criacao, agendamento
- Read-only: nao passar handlers de update/edit/remover/excluir (ou passar noop)
- Detalhes (sheets/sidebars): manter apenas visualizacao, sem botoes de acao
- Breadcrumb: Home > Calendario Expedicao
- BackPath: `/home`

## 3. Adicionar secao de Acesso Rapido na Home

**Arquivo:** `src/pages/Home.tsx`

Abaixo da lista de botoes de modulos (apos o map de `menuItems`), adicionar:
- Titulo "Acesso Rapido" com estilo consistente
- 2 botoes horizontais (grid 2 colunas):
  - Icone `Factory` + "Pedidos Producao" -> navega para `/home/pedidos-producao`
  - Icone `Calendar` + "Calendario Expedicao" -> navega para `/home/calendario-expedicao`
- Estilo: cards com fundo glassmorphism (bg-white/5, border-white/10), similar aos botoes existentes mas menores
- Sem verificacao de permissao (acessivel a todos usuarios logados)

## 4. Adicionar rotas no App.tsx

**Arquivo:** `src/App.tsx`

Adicionar 2 novas rotas protegidas (sem routeKey especifico, acessiveis a qualquer usuario autenticado):
```
<Route path="/home/pedidos-producao" element={<ProtectedRoute><PedidosProducaoReadOnly /></ProtectedRoute>} />
<Route path="/home/calendario-expedicao" element={<ProtectedRoute><CalendarioExpedicaoReadOnly /></ProtectedRoute>} />
```

## Detalhes tecnicos

- As novas paginas usarao os mesmos hooks de dados (`usePedidosEtapas`, `usePedidosContadores`, `useOrdensCarregamentoCalendario`, etc.) pois sao apenas leitura
- Os componentes de calendario (`CalendarioSemanalExpedicaoMobile`, `CalendarioSemanalExpedicaoDesktop`, `CalendarioMensalExpedicaoDesktop`) serao reutilizados com handlers noop para callbacks de edicao
- O `MinimalistLayout` sera usado na pagina de pedidos; a pagina do calendario usara o layout proprio do tema preto com `AnimatedBreadcrumb`
- Nenhuma alteracao no banco de dados necessaria

