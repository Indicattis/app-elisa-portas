
## Plano: Exibir descrição abaixo do nome nos cards NEO (gestão de fábrica)

### Diagnóstico
- **NeoInstalacaoCardGestao** (list view): já exibe `descricao` abaixo do nome do cliente (linhas 130-133) — nenhuma alteração necessária.
- **NeoCorrecaoCardGestao** (list view): a descrição aparece apenas no tooltip, não visualmente abaixo do nome.

### Alteração

**`src/components/pedidos/NeoCorrecaoCardGestao.tsx`**
- Na Col 4 (nome do cliente, linhas 108-122), substituir o `<h3>` simples por um wrapper `<div>` com o nome + descrição abaixo, idêntico ao padrão já usado no `NeoInstalacaoCardGestao`:

```tsx
// De:
<h3 className="font-semibold text-sm truncate">...</h3>

// Para:
<div className="min-w-0">
  <h3 className="font-semibold text-sm truncate">...</h3>
  {neoCorrecao.descricao && (
    <p className="text-[9px] text-muted-foreground truncate leading-tight -mt-0.5">
      {neoCorrecao.descricao}
    </p>
  )}
</div>
```

### Arquivo alterado
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx` (1 bloco, ~5 linhas)
