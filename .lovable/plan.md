
# Plano: Corrigir Erro de React.Fragment

## Problema Identificado

No arquivo `src/components/pedidos/CriarPedidoTesteModal.tsx`, nas linhas 256-264, está sendo usado `React.Fragment` dentro de um `.map()`. O Lovable injeta automaticamente props `data-lov-id` nos elementos, mas `React.Fragment` não aceita props além de `key` e `children`, causando o warning.

**Código problemático (linhas 256-264):**
```tsx
{fluxoPrevisto.map((etapa, index) => (
  <Fragment key={etapa}>
    <Badge ...>{etapa}</Badge>
    {index < fluxoPrevisto.length - 1 && (
      <ArrowRight ... />
    )}
  </Fragment>
))}
```

## Solução

Substituir `<Fragment>` por `<span>` com `className="contents"`. A classe `contents` do CSS faz o elemento não gerar box próprio, mantendo o layout flex intacto.

**Código corrigido:**
```tsx
{fluxoPrevisto.map((etapa, index) => (
  <span key={etapa} className="contents">
    <Badge ...>{etapa}</Badge>
    {index < fluxoPrevisto.length - 1 && (
      <ArrowRight ... />
    )}
  </span>
))}
```

## Alteração

| Arquivo | Modificação |
|---------|-------------|
| `src/components/pedidos/CriarPedidoTesteModal.tsx` | Substituir `<Fragment>` por `<span className="contents">` |

## Resultado

- O warning de `data-lov-id` em `React.Fragment` será eliminado
- O layout visual permanece idêntico (graças a `display: contents`)
- A funcionalidade não é afetada
