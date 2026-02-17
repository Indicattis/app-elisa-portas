

# Transferir listagens do Controle para Expedicao com DnD e agendamento

## Resumo

Substituir as secoes "Ordens Disponiveis para Agendamento" e "Servicos Avulsos Pendentes" em `/logistica/expedicao` pelas listagens de pedidos por etapa que hoje existem em `/logistica/controle`, adicionando drag-and-drop para reordenacao e um botao de agendar no calendario em cada item.

## O que muda

### Secoes removidas da Expedicao
- Card "Ordens Disponiveis para Agendamento" (OrdensCarregamentoDisponiveis / Mobile)
- Card "Servicos Avulsos Pendentes" (NeoServicosDisponiveis / Mobile)

### Secoes adicionadas na Expedicao
- Tabs com 3 etapas: **Aguardando Coleta**, **Instalacoes**, **Correcoes**
- Cada tab mostra:
  - Neo Instalacoes/Correcoes avulsas (quando aplicavel) com cards existentes
  - Lista de pedidos com `PedidosDraggableList` com DnD habilitado
  - Botao de **agendar no calendario** em cada pedido/neo (abre o modal `AdicionarOrdemCalendarioModal` pre-preenchido)
- Filtros existentes (busca, tipo entrega, cor pintura, mostrar prontos)
- Paginacao existente
- Responsavel por etapa com avatar

## Alteracoes tecnicas

### 1. `src/pages/logistica/ExpedicaoMinimalista.tsx`

- Importar hooks: `usePedidosEtapas`, `usePedidosContadores`, `useNeoInstalacoesListagem`, `useNeoCorrecoesListagem`, `useEtapaResponsaveis`
- Importar componentes: `PedidosDraggableList`, `PedidosFiltrosMinimalista`, `NeoInstalacaoCardGestao`, `NeoCorrecaoCardGestao`, `SelecionarResponsavelEtapaModal`, `Tabs/TabsList/TabsTrigger/TabsContent`
- Adicionar estados: `etapaAtiva`, `searchTerm`, `tipoEntrega`, `corPintura`, `mostrarProntos`, `paginaAtual`, `modalResponsavelAberto`, `etapaParaAtribuir`
- Adicionar handlers: `handleReorganizar`, `handleMoverEtapa`, `handleRetrocederEtapa`, `handleMoverPrioridade`, `handleArquivar`, `handleDeletarPedido`
- Remover os dois Cards antigos (OrdensCarregamentoDisponiveis + NeoServicosDisponiveis)
- Adicionar novo Card com Tabs replicando a estrutura de `ControleLogistica.tsx` mas com:
  - `enableDragAndDrop={true}` e `showPosicao={true}` no PedidosDraggableList
  - Botao "Agendar" em cada NeoInstalacaoCardGestao e NeoCorrecaoCardGestao (via novo prop ou wrapper)

### 2. Botao "Agendar" nos cards de pedido

Duas opcoes para adicionar o botao de agendar:

**Opcao escolhida**: Criar um wrapper component `PedidoCardComAgendar` que envolve cada item na listagem e adiciona um icone de calendario clicavel. Ao clicar, abre o `AdicionarOrdemCalendarioModal` pre-preenchido com os dados do pedido/neo.

- Para pedidos: o modal recebe `pedido_id`, `nome_cliente`, `fonte: 'instalacoes'` ou `'ordens_carregamento'`
- Para neo instalacoes: agenda diretamente via `updateNeoInstalacao({ data_instalacao: data })`
- Para neo correcoes: agenda diretamente via `updateNeoCorrecao({ data_correcao: data })`

### 3. `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

- Adicionar prop opcional `onAgendar?: (id: string) => void`
- Renderizar botao com icone Calendar ao lado do botao Concluir quando `onAgendar` estiver presente

### 4. `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

- Mesma alteracao: prop `onAgendar` e botao Calendar

### 5. `src/components/pedidos/PedidoCard.tsx`

- Adicionar prop opcional `onAgendar?: (pedidoId: string) => void`
- Renderizar botao Calendar na area de acoes quando presente

### 6. `src/components/pedidos/PedidosDraggableList.tsx`

- Adicionar prop `onAgendar?: (pedidoId: string) => void` e repassar para PedidoCard

### 7. Limpeza (opcional, pode ser feita depois)

- Remover imports nao mais usados de `OrdensCarregamentoDisponiveis`, `OrdensCarregamentoDisponiveisMobile`, `NeoServicosDisponiveis`, `NeoServicosDisponiveisMobile` da pagina
- Remover hooks `useNeoInstalacoesSemData`, `useNeoCorrecoesSemData`, `useCorrecoesSemData` que nao serao mais necessarios nessa pagina

### 8. Rota `/logistica/controle`

- Mantida como esta (nao sera removida), apenas o conteudo sera duplicado na expedicao

## Fluxo de agendamento

1. Usuario clica no icone Calendar em um pedido/neo
2. Abre `AdicionarOrdemCalendarioModal` (ja existente no sistema)
3. Usuario seleciona data, tipo de carregamento, responsavel
4. Confirma e o item aparece no calendario acima

## Resumo de arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| ExpedicaoMinimalista.tsx | Substituir 2 cards por tabs com listagem DnD |
| PedidoCard.tsx | Adicionar prop/botao onAgendar |
| PedidosDraggableList.tsx | Repassar prop onAgendar |
| NeoInstalacaoCardGestao.tsx | Adicionar prop/botao onAgendar |
| NeoCorrecaoCardGestao.tsx | Adicionar prop/botao onAgendar |

