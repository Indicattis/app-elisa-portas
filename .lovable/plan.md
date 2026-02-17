

# Aplicar mesmas alteracoes para etapa Expedicao Coleta (aguardando_coleta)

## Resumo

Replicar as alteracoes feitas para `instalacoes` na etapa `aguardando_coleta`:
1. Remover o botao vermelho de retroceder pedido
2. Alterar o botao roxo para mover o pedido diretamente para `correcoes` (em vez de gerar ordem de correcao)

## Alteracoes

### `src/components/pedidos/PedidoCard.tsx`

1. **Linha 1520** - Adicionar `&& etapaAtual !== 'aguardando_coleta'` na condicao `podeRetroceder` para ocultar o botao de retroceder nessa etapa.

2. **Linha 1575-1576** - Mover `aguardando_coleta` da lista `etapasCorrecao` (que abre modal de gerar correcao) para a condicao que usa `setShowEnviarCorrecao` (que move o pedido diretamente para correcoes):
   - Alterar a condicao da linha 1576 de `etapaAtual === 'instalacoes'` para `(etapaAtual === 'instalacoes' || etapaAtual === 'aguardando_coleta')`
   - Remover `'aguardando_coleta'` da lista `etapasCorrecao` na linha 1575

## Detalhes tecnicos

- Apenas o arquivo `PedidoCard.tsx` sera editado
- O hook `useEnviarParaCorrecao` ja aceita `etapaOrigem` dinamico (alterado na implementacao anterior), entao funcionara automaticamente para `aguardando_coleta`
- O `EnviarCorrecaoModal` de confirmacao ja esta conectado e passa `etapaOrigem: etapaAtual`

