

# Refatorar Cobrancas para usar layout da Gestao de Fabrica

## Objetivo

Substituir o layout customizado da pagina `/administrativo/financeiro/cobrancas` pelo mesmo design e componentes da aba "Finalizado" em `/direcao/gestao-fabrica`. Em vez de cards customizados com dados de cobranca, a pagina mostrara os pedidos finalizados usando o `PedidoCard` e `PedidosDraggableList`.

## Mudancas

### Arquivo: `src/pages/administrativo/CobrancasMinimalista.tsx`

Refatorar completamente o conteudo da pagina:

1. **Trocar o hook de dados**: Substituir `useCobrancasPendentes` por `usePedidosEtapas('finalizado')`, que busca os pedidos na etapa "finalizado" com todos os dados de venda, produtos, etc.

2. **Substituir os cards customizados** (`CobrancaCard`) pelo componente `PedidosDraggableList`, o mesmo usado na gestao de fabrica. Configurar com:
   - `etapa="finalizado"`
   - `enableDragAndDrop={false}` (sem reordenacao)
   - `hideOrdensStatus={true}` (como na gestao fabrica para finalizado)
   - `disableClienteClick={false}` (permitir navegacao)
   - Sem acoes de mover etapa, retroceder, arquivar ou deletar (somente visualizacao)

3. **Manter o `MinimalistLayout`** com breadcrumbs e titulo, mas remover os cards de resumo (Total Pendente, Clientes, Parcelas, Vencidos) e a busca customizada.

4. **Adicionar filtro de busca** usando `PedidosFiltrosMinimalista`, o mesmo componente de filtros da gestao de fabrica, para manter consistencia visual.

5. **Manter os servicos Neo finalizados**: Incluir a secao de Neo Instalacoes e Neo Correcoes finalizadas abaixo dos pedidos, usando `NeoInstalacaoCardGestao` e `NeoCorrecaoCardGestao` (mesma estrutura da aba "finalizado" da gestao de fabrica).

### Detalhes tecnicos

- Importar `usePedidosEtapas` de `@/hooks/usePedidosEtapas`
- Importar `PedidosDraggableList` de `@/components/pedidos/PedidosDraggableList`
- Importar `PedidosFiltrosMinimalista` de `@/components/pedidos/PedidosFiltrosMinimalista`
- Importar `useNeoInstalacoesFinalizadas` e `useNeoCorrecoesFinalizadas` para os servicos avulsos
- Importar `NeoInstalacaoCardGestao` e `NeoCorrecaoCardGestao` para os cards Neo
- As funcoes utilitarias de formatacao (`formatCurrency`, `formatPhone`, etc.) e os componentes `CobrancaCard` serao removidos pois nao sao mais necessarios
- O hook `useCobrancasPendentes` permanece no projeto (pode ser usado em outro lugar), apenas nao sera mais importado nesta pagina
- Estado local: `searchTerm`, `tipoEntrega`, `corPintura`, `mostrarProntos` para os filtros
- Para as acoes de reorganizar/mover prioridade, passar funcoes vazias (no-op) ja que a pagina e somente leitura

### Resultado esperado

A pagina de cobrancas tera exatamente o mesmo visual da aba "Finalizado" da gestao de fabrica: uma lista de `PedidoCard` com informacoes do cliente, valor da venda, tipo de entrega, tempo desde o faturamento, e os servicos Neo finalizados abaixo.

