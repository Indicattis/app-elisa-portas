
# Ocultar botao de agendamento em neos ja agendadas

## Resumo

Nos cards de Instalacoes Avulsas e Correcoes Avulsas em `/logistica/expedicao`, o botao de agendar (CalendarPlus) sera ocultado quando a neo ja tiver data agendada.

## Alteracoes

### 1. `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

Na condicao de renderizacao do botao de agendar (linha 283), adicionar verificacao de `data_instalacao`:

De: `{onAgendar && !showConcluido && (`
Para: `{onAgendar && !showConcluido && !neoInstalacao.data_instalacao && (`

### 2. `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

Na condicao de renderizacao do botao de agendar (linha 264), adicionar verificacao de `data_correcao`:

De: `{onAgendar && !showConcluido && (`
Para: `{onAgendar && !showConcluido && !neoCorrecao.data_correcao && (`

## Resultado esperado

- Neos que ja possuem data agendada nao mostram o botao de agendar
- Quando uma neo e removida do calendario (data limpa), o botao de agendar reaparece automaticamente
- Nenhuma outra pagina e afetada, pois a logica esta no componente do card
