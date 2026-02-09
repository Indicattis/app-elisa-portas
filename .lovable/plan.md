
# Priorizar autorizados premium no topo da listagem por cidade

## O que sera feito

Ordenar a lista de autorizados dentro de cada cidade (e tambem na secao de orfaos) para que os premium aparecam sempre no topo, seguidos dos ativos.

## Detalhes tecnicos

### Editar: `src/components/autorizados/CidadeCollapsible.tsx`

Duas alteracoes simples:

1. **No componente `CidadeCollapsible`** (linha 123): antes de renderizar `cidade.autorizados.map(...)`, ordenar o array com premium primeiro:

```typescript
{[...cidade.autorizados]
  .sort((a, b) => (a.etapa === 'premium' ? -1 : 1) - (b.etapa === 'premium' ? -1 : 1))
  .map(aut => (
    <AutorizadoRow ... />
  ))}
```

2. **No componente `OrfaosCollapsible`** (linha 271): aplicar a mesma ordenacao antes do `.map(...)`:

```typescript
{[...autorizados]
  .sort((a, b) => (a.etapa === 'premium' ? -1 : 1) - (b.etapa === 'premium' ? -1 : 1))
  .map(aut => (
    ...
  ))}
```

### Arquivo modificado

- `src/components/autorizados/CidadeCollapsible.tsx`
