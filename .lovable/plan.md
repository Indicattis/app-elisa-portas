

## Plano: Corrigir exclusão de pedido que não funciona

### Causa raiz

O componente `AlertDialogAction` do Radix UI fecha automaticamente o dialog ao ser clicado. Isso acontece **antes** da função assíncrona `onConfirmar` completar a execução. O dialog desmonta e a operação de exclusão pode ser cancelada ou nunca concluída.

### Correção

**`src/components/pedidos/ExcluirPedidoModal.tsx`**
- Adicionar `e.preventDefault()` no `onClick` do `AlertDialogAction` para impedir o fechamento automático do dialog
- O dialog só fechará manualmente após a conclusão da operação (já implementado em `handleConfirmarExclusao` no `PedidoCard.tsx` que chama `setShowExcluirPedido(false)`)

```tsx
<AlertDialogAction
  onClick={(e) => {
    e.preventDefault();
    onConfirmar();
  }}
  disabled={isLoading}
  ...
>
```

Essa é uma correção de uma linha que resolve o problema sem alterar nenhum outro arquivo.

