
# Estilizacao condicional das pastas de cidades

## Resumo

Alterar a cor de fundo/borda do trigger colapsavel de cada cidade com base no numero de autorizados premium:

- **Verde**: 2 ou mais autorizados premium
- **Vermelho**: 0 autorizados (cidade vazia)
- **Normal** (atual): qualquer outro caso

## Detalhes tecnicos

### Arquivo: `src/components/autorizados/CidadeCollapsible.tsx`

No componente `CidadeCollapsible`, calcular o numero de autorizados premium e o total de autorizados para determinar a cor:

```typescript
const totalAutorizados = cidade.autorizados.length;
const totalPremium = cidade.autorizados.filter(a => a.etapa === 'premium').length;

// Verde: 2+ premium | Vermelho: 0 autorizados | Normal: restante
const isGreen = totalPremium >= 2;
const isRed = totalAutorizados === 0;
```

Aplicar classes condicionais no div do `CollapsibleTrigger` (linha 51):

- **Verde**: `bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20` + icone e badge em tons de verde
- **Vermelho**: `bg-red-500/10 hover:bg-red-500/20 border border-red-500/20` + icone e badge em tons de vermelho
- **Normal**: manter `bg-white/5 hover:bg-white/10` atual

Tambem ajustar as cores do icone `Building2`, do texto do badge e do `ChevronDown` conforme a variante.

### Arquivo unico

1. **Editar**: `src/components/autorizados/CidadeCollapsible.tsx` -- adicionar logica condicional de cores no trigger da cidade
