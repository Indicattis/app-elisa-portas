

# Ordenar Servicos Avulsos por prioridade e habilitar drag-and-drop no Controle

## Resumo

Duas alteracoes solicitadas:

1. **Expedicao - Servicos Avulsos Pendentes**: A lista em `/logistica/expedicao` deve respeitar a mesma ordenacao por `prioridade_gestao` definida em `/direcao/gestao-fabrica`, em vez de ordenar por `created_at`.

2. **Controle de Logistica - Drag and Drop**: Em `/logistica/controle`, o usuario deve poder reordenar pedidos via drag-and-drop (atualmente `enableDragAndDrop={false}`).

---

## Detalhes tecnicos

### 1. Ordenacao dos Servicos Avulsos na Expedicao

**Arquivos:** `src/hooks/useNeoInstalacoes.ts`, `src/hooks/useNeoCorrecoes.ts`

Os hooks `useNeoInstalacoesSemData` e `useNeoCorrecoesSemData` atualmente ordenam por `created_at desc`. Alterar para ordenar por `prioridade_gestao desc` (igual ao hook de listagem da gestao de fabrica):

- `useNeoInstalacoesSemData`: trocar `.order("created_at", { ascending: false })` por `.order("prioridade_gestao", { ascending: false }).order("created_at", { ascending: false })`
- `useNeoCorrecoesSemData`: mesma alteracao

O componente `NeoServicosDisponiveis` ja recebe os dados ordenados, entao nenhuma alteracao e necessaria nele.

### 2. Habilitar drag-and-drop no Controle de Logistica

**Arquivo:** `src/pages/logistica/ControleLogistica.tsx`

Alterar a prop `enableDragAndDrop={false}` para `enableDragAndDrop={true}` no componente `PedidosDraggableList` (linha 465). Tambem alterar `showPosicao={false}` para `showPosicao={true}` (linha 466) para que o usuario veja a posicao dos pedidos.

A infraestrutura de drag-and-drop ja existe no componente `PedidosDraggableList` e os handlers `handleReorganizar` e `handleMoverPrioridade` ja estao implementados na pagina.

