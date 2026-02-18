

# Corrigir Breadcrumb na pagina de detalhes do pedido

## Problema

A pagina `PedidoViewMinimalista` nao passa a prop `breadcrumbItems` para o `MinimalistLayout`. Como o `backPath` e `/administrativo/pedidos` (nao corresponde a nenhum caso pre-definido no layout), o breadcrumb gerado automaticamente mostra apenas:

**Home > Pedido #XXX** (incorreto)

## Correcao

Adicionar a prop `breadcrumbItems` ao `MinimalistLayout` em `src/pages/administrativo/PedidoViewMinimalista.tsx` (linha 447):

```typescript
<MinimalistLayout 
  title={`Pedido #${pedido.numero_pedido}`}
  subtitle={...}
  backPath="/administrativo/pedidos"
  breadcrumbItems={[
    { label: 'Home', path: '/home' },
    { label: 'Administrativo', path: '/administrativo' },
    { label: 'Pedidos', path: '/administrativo/pedidos' },
    { label: `Pedido #${pedido.numero_pedido}` }
  ]}
  headerActions={...}
>
```

Resultado esperado: **Home > Administrativo > Pedidos > Pedido #XXX**

Apenas uma linha adicionada, sem alteracao de logica.

