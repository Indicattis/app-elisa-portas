
# Copiar botoes de acao da Expedicao para Gestao de Fabrica

## Resumo

Adicionar ao `GestaoFabricaDirecao.tsx` os mesmos botoes de acao que existem na listagem de pedidos em `/logistica/expedicao`, especificamente nas etapas `aguardando_coleta`, `instalacoes`, `correcoes` e `finalizado`.

## O que falta em Gestao de Fabrica

Comparando as duas paginas, a `PedidosDraggableList` em Gestao de Fabrica nao recebe:
- `onAgendar` - botao de agendar no calendario
- `onDeletar` - botao de excluir pedido
- `onCorrecaoDetalhesClick` - abrir detalhes de correcao (etapa correcoes)
- `hideOrdensStatus` / `hideCorrecaoButton` / `showPosicao` - flags visuais

As listas de Neo (Instalacoes e Correcoes) tambem nao recebem:
- `onAgendar` - agendar Neo no calendario
- `onEditar` - editar Neo

## Alteracoes

### 1. `src/pages/direcao/GestaoFabricaDirecao.tsx`

**Novos imports:**
- `CorrecaoDetalhesSheet` de `@/components/pedidos/CorrecaoDetalhesSheet`
- `AdicionarOrdemCalendarioModal` de `@/components/expedicao/AdicionarOrdemCalendarioModal`
- `useNavigate` de `react-router-dom` (se nao existir)

**Novos states:**
- `correcaoDetalhesPedidoId` e `correcaoDetalhesOpen` para o sheet de correcao
- `agendarModalOpen` e `agendarData` para o modal de agendamento

**Novos handlers:**
- `handleAgendarPedido` - abre modal de agendamento
- `handleEditarNeoInstalacao` - navega para editar Neo Instalacao
- `handleEditarNeoCorrecao` - navega para editar Neo Correcao

**Atualizar `PedidosDraggableList` (linha 540):**

Adicionar props condicionais para as etapas de logistica:
```
onAgendar={['aguardando_coleta','instalacoes','correcoes'].includes(etapa) ? handleAgendarPedido : undefined}
onDeletar={handleDeletarPedido}
onCorrecaoDetalhesClick={etapa === 'correcoes' ? (pedidoId) => { setCorrecaoDetalhesPedidoId(pedidoId); setCorrecaoDetalhesOpen(true); } : undefined}
hideOrdensStatus={['aguardando_coleta','instalacoes','correcoes','finalizado'].includes(etapa)}
showPosicao={true}
```

**Atualizar `NeoInstalacoesDraggableList` (linha 560):**
Adicionar:
```
onAgendar={(id) => { setAgendarData(new Date()); setAgendarModalOpen(true); }}
onEditar={handleEditarNeoInstalacao}
```

**Atualizar `NeoCorrecoesDraggableList` (linha 574):**
Adicionar:
```
onAgendar={(id) => { setAgendarData(new Date()); setAgendarModalOpen(true); }}
onEditar={handleEditarNeoCorrecao}
```

**Renderizar novos componentes no final do JSX:**
- `CorrecaoDetalhesSheet` (com `correcaoDetalhesPedidoId` e `correcaoDetalhesOpen`)
- `AdicionarOrdemCalendarioModal` (com `agendarModalOpen` e `agendarData`)

### 2. Nenhuma outra pagina ou componente precisa ser alterado

Os componentes `PedidosDraggableList`, `NeoInstalacoesDraggableList` e `NeoCorrecoesDraggableList` ja suportam todas essas props - so nao estavam sendo passadas em GestaoFabrica.
