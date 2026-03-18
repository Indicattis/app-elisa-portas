

## Plano: Esconder ações do PedidoCard fora da etapa "Aberto"

### Mudança

No arquivo `src/pages/administrativo/PedidosAdminMinimalista.tsx`, na renderização do `PedidoCard` (linha ~395), passar `readOnly={true}` quando a etapa não for `'aberto'`.

### Alteração

**Arquivo**: `src/pages/administrativo/PedidosAdminMinimalista.tsx` (~linha 395)

Trocar:
```tsx
<PedidoCard
  key={pedido.id}
  pedido={pedido}
  isAberto={etapaConfig.id === 'aberto'}
  viewMode="list"
  onMoverEtapa={handleMoverEtapa}
  onRetrocederEtapa={handleRetrocederEtapa}
  onDeletar={etapaConfig.id === 'aberto' ? handleDeletarPedido : undefined}
  onAvisoEspera={handleAvisoEspera}
/>
```

Por:
```tsx
<PedidoCard
  key={pedido.id}
  pedido={pedido}
  isAberto={etapaConfig.id === 'aberto'}
  viewMode="list"
  readOnly={etapaConfig.id !== 'aberto'}
  onMoverEtapa={handleMoverEtapa}
  onRetrocederEtapa={handleRetrocederEtapa}
  onDeletar={etapaConfig.id === 'aberto' ? handleDeletarPedido : undefined}
  onAvisoEspera={handleAvisoEspera}
/>
```

O `PedidoCard` já respeita a prop `readOnly` para ocultar todos os botões de ação. Basta passá-la como `true` para etapas diferentes de `'aberto'`.

