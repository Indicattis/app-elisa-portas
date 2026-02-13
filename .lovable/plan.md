
# Legendas como filtro rapido na Expedicao

## Resumo
Tornar cada item da legenda clicavel para funcionar como filtro rapido. Ao clicar em uma legenda, somente os cards daquele tipo serao exibidos no calendario. Clicar novamente desativa o filtro.

## Alteracoes

### 1. Componente: `src/components/expedicao/CalendarioLegendas.tsx`
- Adicionar props: `activeLegend?: string | null` e `onToggle?: (legend: string) => void`
- Definir as 5 legendas como array de objetos com `id`, `label`, `bgColor`, `borderColor`
- Tornar cada item clicavel com cursor pointer
- Quando `activeLegend` esta ativo, destacar o item selecionado (opacidade total) e esmaecer os demais (opacidade 0.4)
- IDs das legendas: `elisa`, `autorizados`, `entrega`, `neo_instalacao`, `neo_correcao`

### 2. Pagina: `src/pages/logistica/ExpedicaoMinimalista.tsx`
- Adicionar estado `legendaFiltro: string | null` (default `null`)
- Passar `activeLegend` e `onToggle` para `CalendarioLegendas` (via calendarios)
- Antes de passar `ordens`, `neoInstalacoes`, `neoCorrecoes` para os calendarios, aplicar filtro:
  - `elisa`: apenas ordens com `tipo_carregamento === 'elisa'` e `tipo_entrega !== 'entrega'`
  - `autorizados`: apenas ordens com `tipo_carregamento === 'autorizados'`
  - `entrega`: apenas ordens com `tipo_entrega === 'entrega'`
  - `neo_instalacao`: apenas neoInstalacoes (ordens e neoCorrecoes ficam vazias)
  - `neo_correcao`: apenas neoCorrecoes (ordens e neoInstalacoes ficam vazias)
  - `null`: sem filtro, mostra tudo

### 3. Calendarios Desktop e Mobile
- `CalendarioSemanalExpedicaoDesktop`, `CalendarioMensalExpedicaoDesktop`, `CalendarioSemanalExpedicaoMobile`: adicionar props `activeLegend` e `onLegendToggle` para repassar ao `CalendarioLegendas`

## Secao Tecnica

### Logica de filtragem (na pagina ExpedicaoMinimalista)
```text
const ordensFiltradas = !legendaFiltro ? ordens
  : legendaFiltro === 'elisa' ? ordens.filter(o => o.tipo_carregamento === 'elisa' && o.venda?.tipo_entrega !== 'entrega')
  : legendaFiltro === 'autorizados' ? ordens.filter(o => o.tipo_carregamento === 'autorizados')
  : legendaFiltro === 'entrega' ? ordens.filter(o => o.venda?.tipo_entrega === 'entrega')
  : []

const neoInstalacoesFiltradas = !legendaFiltro || legendaFiltro === 'neo_instalacao' ? neoInstalacoes : []
const neoCorrecoesFiltradas = !legendaFiltro || legendaFiltro === 'neo_correcao' ? neoCorrecoes : []
```

### Props do CalendarioLegendas atualizado
```text
interface CalendarioLegendasProps {
  activeLegend?: string | null;
  onToggle?: (legend: string) => void;
}
```

### Estilo visual do filtro ativo
- Item ativo: borda mais forte, escala ligeiramente maior, sombra sutil
- Itens inativos: opacidade 0.4
- Sem filtro: todos com opacidade normal (comportamento atual)
