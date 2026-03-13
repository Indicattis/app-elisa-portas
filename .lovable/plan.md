

## Plano: Botão "Finalizar Direto" na Gestão de Fábrica

### O que será feito

Adicionar um botão em cada pedido (exceto os já finalizados) na página `/direcao/gestao-fabrica` que move o pedido instantaneamente para a etapa "Finalizado", pulando todas as etapas intermediárias. Exclusivo desta página.

### Mudanças

**1. `src/components/pedidos/PedidoCard.tsx`**
- Adicionar prop `onFinalizarDireto?: (pedidoId: string) => Promise<void>`
- Renderizar botão com ícone `CheckCircle2` e texto "Finalizar Direto" quando a prop existir e a etapa não for `finalizado`
- Incluir `AlertDialog` de confirmação antes de executar

**2. `src/components/pedidos/PedidosDraggableList.tsx`**
- Adicionar prop `onFinalizarDireto` na interface e propagá-la para `SortableItem` → `PedidoCard`

**3. `src/hooks/usePedidosEtapas.ts`**
- Adicionar mutation `finalizarDireto` que:
  - Fecha a etapa atual (seta `data_saida`)
  - Faz upsert na etapa `finalizado` (usando `ON CONFLICT` como padrão do projeto)
  - Atualiza `etapa_atual = 'finalizado'` no `pedidos_producao`

**4. `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Criar handler `handleFinalizarDireto` usando a nova mutation
- Passar `onFinalizarDireto={handleFinalizarDireto}` ao `PedidosDraggableList` (somente nesta página)

### Fluxo
1. Usuário clica "Finalizar Direto" no card do pedido
2. AlertDialog pede confirmação ("Tem certeza? O pedido será movido diretamente para Finalizado")
3. Ao confirmar: etapa atual é encerrada, etapa `finalizado` é criada, `etapa_atual` atualizado
4. Lista atualiza automaticamente via invalidação de queries

