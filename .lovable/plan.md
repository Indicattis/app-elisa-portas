
# Simplificar a página /producao/instalacoes

## Mudanças

### 1. `src/pages/producao/ProducaoInstalacoes.tsx`
- Remover os dois `Select` de filtro (equipe e autorizado) e o `Button` de download PDF (linhas 155-208 área dos filtros/download)
- Remover states e queries relacionados: `equipeIdFiltro`, `autorizadoIdFiltro`, query `equipes_instalacao_ativas_filtro`, `useAutorizadosAptos`, `handleDownloadPDF`, `displayEquipeNome`, `displayEquipeCor`
- Remover imports não mais usados (`Download`, `Filter`, `Select*`, `baixarCronogramaMinimalistaPDF`, `useAutorizadosAptos`)
- Passar `hideLegendas={true}` nos 3 componentes de calendário

### 2. Adicionar prop `hideLegendas?: boolean` nos 3 componentes de calendário
- `src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx` — aceitar prop, renderizar `CalendarioLegendas` condicionalmente
- `src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx` — idem
- `src/components/expedicao/CalendarioSemanalExpedicaoMobile.tsx` — idem

### Arquivos alterados
- `src/pages/producao/ProducaoInstalacoes.tsx`
- `src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx`
- `src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx`
- `src/components/expedicao/CalendarioSemanalExpedicaoMobile.tsx`
