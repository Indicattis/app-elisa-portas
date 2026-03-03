

# Botão "Retornar para Finalizado" nos pedidos arquivados

## Resumo
Adicionar um botão em cada card de pedido arquivado na aba Arquivo Morto que desarquiva o pedido, retornando-o para a etapa "finalizado".

## Alterações em `src/pages/direcao/GestaoFabricaDirecao.tsx`

1. **Adicionar estado e handler** para desarquivar:
   - Criar função `handleDesarquivar(pedidoId)` que executa `UPDATE` em `pedidos_producao` setando `arquivado = false`, `data_arquivamento = null`, `arquivado_por = null`
   - Mostrar toast de sucesso e invalidar queries `['pedidos-arquivados']` e `['pedidos-contadores']`

2. **Adicionar botão no card** de cada pedido arquivado (ao lado das informações de data/valor):
   - Botão com ícone `Undo2` (ou `RotateCcw`) e tooltip "Retornar para Finalizado"
   - Variante `outline`, tamanho `icon`, com estilo emerald
   - Estado de loading durante a operação

3. **Importar** `Undo2` do lucide-react e `useAuth` para registrar quem fez a ação

A operação é simples: apenas desmarcar o campo `arquivado` — o pedido já está na etapa `finalizado` e voltará a aparecer na aba correspondente.

