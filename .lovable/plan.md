

# Restaurar botao "Imprimir Todas as Etiquetas" (exceto perfiladeira)

## Problema

Na alteracao anterior, o botao "Imprimir Todas as Etiquetas" foi removido do `OrdemDetalhesSheet.tsx` para todas as ordens. Porem, ele so deveria ter sido removido para ordens de **perfiladeira**.

## Solucao

**Arquivo:** `src/components/production/OrdemDetalhesSheet.tsx` (linha 795)

Restaurar o botao de imprimir etiquetas, condicionando sua exibicao a `tipoOrdem !== 'perfiladeira'`:

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm font-medium">Itens de Produção</span>
</div>
{tipoOrdem !== 'perfiladeira' && ordem.pedido && (
  <Button
    size="sm"
    variant="outline"
    className="gap-1"
    onClick={() => setImprimirEtiquetasOpen(true)}
  >
    <Printer className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Imprimir Etiquetas</span>
  </Button>
)}
```

Isso restaura o botao para separacao, soldagem, pintura, qualidade e demais tipos, mantendo-o oculto apenas na perfiladeira.

