
# Impedir Reagendamento de Pedidos com Carregamento Concluido

## Resumo

Pedidos cujas ordens de carregamento (tabela `ordens_carregamento`) ou ordens de instalacao (tabela `instalacoes`) ja foram carregadas (`carregamento_concluido = true`) nao poderao ser reagendados. Atualmente ja existem filtros nos hooks que excluem ordens concluidas das listas do calendario e do modal de agendamento, mas faltam guardas explicitas nos componentes de UI.

## Alteracoes

### 1. `src/components/pedidos/PedidoCard.tsx`

**Linha 1561** - Adicionar `!carregamentoConcluido` na condicao do botao de agendar:

```
// De:
if (onAgendar && !temDataCarregamento && (etapaAtual === 'aguardando_coleta' || ...))

// Para:
if (onAgendar && !temDataCarregamento && !carregamentoConcluido && (etapaAtual === 'aguardando_coleta' || ...))
```

Isso garante que mesmo com inconsistencias de dados, o botao de agendar nunca apareca para pedidos com carregamento concluido.

### 2. `src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx`

**`handleDragEnd` (~linha 160-180)** - Antes de atualizar a data de uma ordem de carregamento, verificar se `carregamento_concluido` e `true`. Se for, exibir toast de erro e retornar sem fazer nada:

```
if (ordem.carregamento_concluido) {
  toast.error("Este pedido ja foi carregado e nao pode ser reagendado");
  return;
}
```

### 3. `src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx`

Mesma guarda do item 2, no `handleDragEnd` do calendario semanal: bloquear drag-and-drop para ordens com `carregamento_concluido === true`.

## Secao Tecnica

### Protecoes ja existentes (nao precisam de alteracao)

- `useOrdensCarregamentoCalendario.ts`: ja filtra `.eq("carregamento_concluido", false)` nas duas queries (ordens_carregamento e instalacoes)
- `useOrdensCarregamentoUnificadas.ts`: ja filtra `.eq("carregamento_concluido", false)` e `.eq("instalacao_concluida", false)`
- `AdicionarOrdemCalendarioModal.tsx`: ja filtra `!o.data_carregamento` e usa o hook acima que exclui concluidos

### Novas protecoes (defesa em profundidade)

- **PedidoCard**: guarda no botao de UI
- **Calendarios**: guarda no handler de drag-and-drop

Essas tres alteracoes garantem que nenhuma rota de UI permita reagendar um pedido com carregamento concluido.
