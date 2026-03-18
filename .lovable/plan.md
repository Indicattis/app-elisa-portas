

## Plano: Remover funcionalidade "Aviso de Espera" da página /administrativo/pedidos

### Mudanças

**Arquivo**: `src/pages/administrativo/PedidosAdminMinimalista.tsx`

1. **Remover o handler `handleAvisoEspera`** (~linhas 230-252) — função que salva/remove o aviso de espera no Supabase
2. **Remover a prop `onAvisoEspera={handleAvisoEspera}`** do `PedidoCard` (~linha 404)

Sem essa prop, o `PedidoCard` automaticamente não renderiza o botão de relógio nem o modal de aviso de espera. Nenhuma alteração no `PedidoCard` é necessária.

