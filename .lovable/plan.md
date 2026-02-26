
## Diagnóstico do que ainda está errado

Você está certo: o fluxo que eu tinha ajustado antes corrigiu o **botão de calendário do cabeçalho da etapa**, mas o clique que você está usando (tooltip **“Agendar no Calendário”**) é outro botão, dentro de cada card de pedido (`PedidoCard.tsx`, linha ~1726).

Pelo replay, você clicou exatamente nesse botão de cada pedido.  
Hoje esse botão chama `onAgendar(pedido.id)`, mas em `GestaoFabricaDirecao.tsx` o `handleAgendarPedido` ignora o `pedidoId` e apenas abre `AdicionarOrdemCalendarioModal` genérico. Resultado: não abre direto com o pedido certo + input de data imediato como você pediu.

## Correção que vou implementar

### 1) Pré-selecionar o pedido clicado no modal de agendamento
**Arquivo:** `src/pages/direcao/GestaoFabricaDirecao.tsx`

- Adicionar estado para guardar o pedido clicado no ícone:
  - `pedidoAgendamentoId: string | null`
- No `handleAgendarPedido(pedidoId)`, salvar esse ID antes de abrir o modal.
- Buscar a ordem correspondente ao pedido (fonte `instalacoes` quando for etapa instalações) e passar como `ordemPreSelecionada` para `AdicionarOrdemCalendarioModal`.
- Ao fechar o modal, limpar `pedidoAgendamentoId`.

### 2) Garantir que o input de data apareça direto ao clicar no calendário do card
**Arquivo:** `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`

- Ajustar a lógica para, quando existir `ordemPreSelecionada`, já abrir com:
  - ordem selecionada
  - campo de data visível
  - data inicial preenchida
- Manter a lista de ordens apenas para casos sem pré-seleção.
- Validar fallback: se não achar ordem correspondente, mostrar aviso claro e manter fluxo manual.

### 3) Ajustar escopo por etapa para evitar comportamento confuso
**Arquivo:** `src/pages/direcao/GestaoFabricaDirecao.tsx`

- Manter o comportamento especial da etapa `instalacoes` focado em “escolher data para o pedido clicado”.
- Preservar comportamento atual de outras etapas (`aguardando_coleta` e `correcoes`) sem quebrar fluxo existente.

## Resultado esperado após a correção

Ao clicar no ícone **Agendar no Calendário** de um pedido na etapa **Instalações**:
1. abre o modal já no pedido correto,
2. mostra imediatamente o **input de data** para agendar carregamento,
3. confirma sem obrigar selecionar novamente o pedido na lista.

## Validação que vou fazer

1. Etapa `instalacoes`: clicar no calendário de um card e confirmar que abre com input de data pronto.
2. Alterar data e salvar; validar update e refresh de queries.
3. Repetir para outro pedido para garantir que não reutiliza seleção antiga.
4. Confirmar que `aguardando_coleta` e `correcoes` continuam funcionando.

## Observação técnica adicional

No `SelecionarPedidoInstalacaoModal.tsx` existe uso de `<Calendar className="h-3 w-3" />` na linha de “Entrega prevista” onde o esperado era ícone (lucide), não o datepicker. Isso não é a causa principal do seu problema atual, mas vou alinhar esse ponto depois para evitar inconsistência visual/funcional.
