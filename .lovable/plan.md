

# Corrigir calendario da etapa Instalacoes na Gestao de Fabrica

## Problema

Na pagina `/direcao/gestao-fabrica`, ao clicar no botao de calendario na etapa "Instalacoes", o sistema abre o `CalendarioExpedicaoModal` que mostra dados de **expedicao** (ordens de carregamento, neo instalacoes, neo correcoes). Isso esta errado para a etapa de instalacoes — deveria mostrar o calendario de **instalacoes** com os dados da tabela `instalacoes`.

## Solucao

Criar um modal de calendario de instalacoes dedicado e usa-lo quando a etapa ativa for `instalacoes`. Manter o `CalendarioExpedicaoModal` apenas para `aguardando_coleta`.

## Mudancas

### 1. Novo componente: `CalendarioInstalacoesModal.tsx`

Criar um modal em `src/components/pedidos/CalendarioInstalacoesModal.tsx` que:
- Usa o hook `useOrdensInstalacaoCalendario` para buscar dados da tabela `instalacoes`
- Renderiza o componente `CalendarioInstalacoesMensal` (ja existente) em modo somente leitura
- Permite alternar entre visao semanal e mensal (usando `CalendarioInstalacoesSemanal` tambem existente)
- Inclui botao para navegar ao calendario completo de instalacoes (`/logistica/instalacoes`)
- Segue o mesmo padrao visual do `CalendarioExpedicaoModal`

### 2. Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`

- Importar o novo `CalendarioInstalacoesModal`
- Adicionar estado `showCalendarioInstalacoesModal`
- No botao de calendario (linha ~512), condicionar qual modal abrir:
  - Se `etapaAtiva === 'instalacoes'` -> abrir `CalendarioInstalacoesModal`
  - Se `etapaAtiva === 'aguardando_coleta'` -> abrir `CalendarioExpedicaoModal` (comportamento atual)
- Renderizar o novo modal no final do componente

### Detalhes tecnicos

O `CalendarioInstalacoesMensal` requer props como `onUpdateInstalacao` e `onInstalacaoClick`. No modo modal somente leitura:
- `onUpdateInstalacao` sera uma funcao vazia (sem drag-and-drop no modal)
- `onInstalacaoClick` pode abrir detalhes ou ser no-op
- `onRemoverDoCalendario` sera no-op

Os componentes de calendario de instalacoes ja existem e sao reutilizados diretamente, sem necessidade de criar novos componentes de calendario.
