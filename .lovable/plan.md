

# Estilizar valor da despesa real com cores condicionais

## Alteração

No componente `DespesaSection` em `src/pages/direcao/DREMesDirecao.tsx`, linha 178, adicionar lógica condicional de cor:

- Se `tipoRef` existir e `valor_real < valor_maximo_mensal` → texto verde (`text-emerald-400`)
- Se `tipoRef` existir e `valor_real > valor_maximo_mensal` → texto vermelho (`text-red-400`)
- Caso contrário (sem referência ou igual) → texto branco (`text-white`)

```tsx
// Linha 178 - de:
<td className="align-middle text-right text-xs font-medium text-white">

// para:
<td className={`align-middle text-right text-xs font-medium ${
  tipoRef
    ? d.valor_real > tipoRef.valor_maximo_mensal
      ? 'text-red-400'
      : d.valor_real < tipoRef.valor_maximo_mensal
        ? 'text-emerald-400'
        : 'text-white'
    : 'text-white'
}`}>
```

### Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx` — uma única linha alterada

