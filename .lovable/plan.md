

# Alterar botoes de pedidos na etapa Instalacoes

## Resumo

Para pedidos na etapa `instalacoes` na gestao de fabrica:
1. Remover o botao vermelho de retroceder pedido
2. Alterar o botao roxo para mover o pedido diretamente para a etapa `correcoes` (em vez de gerar um pedido de correcao separado)

## Alteracoes

### `src/components/pedidos/PedidoCard.tsx`

1. **Remover botao retroceder para instalacoes**: Na condicao do botao de retroceder (linha 1520), adicionar `&& etapaAtual !== 'instalacoes'` para que o botao nao apareca nessa etapa.

2. **Alterar comportamento do botao roxo para instalacoes**: Na secao do botao de correcao (linhas 1574-1595), quando `etapaAtual === 'instalacoes'`:
   - Em vez de abrir o modal `CriarPedidoCorrecaoModal`, o botao usara o hook `useEnviarParaCorrecao` (ja importado no componente) para mover o pedido para a etapa `correcoes`
   - O tooltip mudara de "Gerar Correcao" para "Enviar para Correcoes"
   - Sera exibido um modal de confirmacao (o `EnviarCorrecaoModal` ja existente) antes de executar a acao

## Detalhes tecnicos

- Arquivo editado: `src/components/pedidos/PedidoCard.tsx`
- O hook `useEnviarParaCorrecao` ja esta importado e disponivel no componente
- O modal `EnviarCorrecaoModal` ja existe e sera reutilizado para confirmar a acao
- A logica de `enviarParaCorrecao` cria o registro na tabela `correcoes`, atualiza a `etapa_atual` para `correcoes` e registra a movimentacao -- porem ele assume origem `finalizado`. Sera necessario ajustar para aceitar a etapa de origem `instalacoes` ou criar um fluxo similar dedicado
- Alternativa: usar diretamente o `onMoverEtapa` com destino fixo `correcoes`, mas o hook `useEnviarParaCorrecao` ja lida com toda a logica necessaria (criar registro correcao, mover etapa, registrar movimentacao)

### Ajuste no `useEnviarParaCorrecao.ts`

- Adicionar parametro opcional `etapaOrigem` (default: `'finalizado'`) para que o hook funcione corretamente quando chamado a partir da etapa `instalacoes`
- Atualizar a query de fechamento de etapa e a movimentacao para usar essa etapa de origem dinamica
