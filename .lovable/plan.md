

## Plano: Corrigir botão "Finalizar Direto" na gestão de fábrica

### Diagnóstico
Duas causas combinadas:

1. **Mutation sem tratamento de erro nos passos 1 e 2**: As chamadas de `update` e `upsert` em `pedidos_etapas` não verificam `error` — falhas são engolidas silenciosamente.

2. **Crash `removeChild`**: Após a mutation, `queryClient.invalidateQueries` remove o pedido da lista, desmontando o `PedidoCard` enquanto o `AlertDialog` ainda está aberto. O portal do Radix tenta limpar nós DOM que já foram removidos → `removeChild` error.

### Alterações

**1. `src/hooks/usePedidosEtapas.ts`** (~5 linhas)
- Adicionar verificação de `error` nos passos 1 (fechar etapa atual) e 2 (upsert finalizado), lançando exceção se houver falha

**2. `src/components/pedidos/PedidoCard.tsx`** (~3 linhas)
- No `onClick` do AlertDialogAction de "Finalizar Direto", fechar o dialog **antes** de chamar `onFinalizarDireto`, evitando que a desmontagem do card conflite com o portal do AlertDialog

### Resultado
- Erros de banco são capturados e exibidos ao usuário via toast
- O dialog fecha antes da mutation, eliminando o crash `removeChild`

