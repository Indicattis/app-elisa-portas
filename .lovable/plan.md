

## Plano: Corrigir e melhorar modal "Finalizar Direto"

### Problema
O AlertDialog atual usa `e.preventDefault()` no onClick do `AlertDialogAction`, o que pode causar conflitos com o comportamento padrão do Radix AlertDialog. Além disso, o modal precisa de uma descrição mais clara do que vai acontecer.

### Alteração

**`src/components/pedidos/PedidoCard.tsx`** (~20 linhas)

Substituir o `AlertDialog` por um `Dialog` customizado (já importado no arquivo) com:

1. Título claro: "Finalizar Pedido Diretamente"
2. Descrição detalhada do que vai acontecer:
   - A etapa atual do pedido (ex: "Pintura") será encerrada
   - Todas as etapas intermediárias serão puladas
   - O pedido será movido diretamente para "Finalizado"
   - Exibir o nome do cliente e número do pedido para confirmação
3. Aviso visual (ícone de alerta) informando que a ação não pode ser desfeita
4. Botões "Cancelar" e "Sim, Finalizar" com estado de loading

A troca de `AlertDialog` para `Dialog` resolve o problema de não funcionar (o `e.preventDefault()` no `AlertDialogAction` impede o fechamento nativo, e a combinação com `setShowFinalizarDireto(false)` manual pode causar conflitos de timing). Com `Dialog` + `Button` padrão, o fluxo fica direto e sem bugs.

### Arquivo alterado
- `src/components/pedidos/PedidoCard.tsx` (1 bloco, ~25 linhas)

