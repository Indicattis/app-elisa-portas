

# Estilizar linhas faturadas com fundo verde

## Alteração

Na linha 776, adicionar condição para aplicar classe de fundo verde quando `produto.faturamento === true`, igual à instalação (`bg-cyan-500/5` → usar `bg-emerald-500/5`):

```tsx
// De:
<TableRow key={produto.id} className="border-white/10 hover:bg-white/5">

// Para:
<TableRow key={produto.id} className={`border-white/10 ${produto.faturamento ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-white/5'}`}>
```

## Arquivo
- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linha 776)

