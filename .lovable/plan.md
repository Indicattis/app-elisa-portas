

## Plano: Corrigir quebra de etiquetas na impressão individual (Embalagem)

### Problema

Ao clicar no botão de impressão individual (ícone de impressora por linha), o sistema gera **apenas 1 etiqueta** com a quantidade total, ignorando as regras de divisor. A função `handleImprimirEtiqueta` (linha 213) faz:

```
quantidade: calculo.quantidade  // quantidade total, sem quebra
tagNumero: 1
totalTags: calculo.etiquetasNecessarias
```

Já a função `handleImprimirTodasEtiquetas` (linha 355) aplica corretamente o divisor, gerando múltiplas etiquetas com quantidades parciais.

### Solução

Modificar `handleImprimirEtiqueta` para aplicar a mesma lógica de quebra de `handleImprimirTodasEtiquetas`: quando há divisor > 1, gerar múltiplas etiquetas com `quantidadeParcial` e usar `gerarPDFEtiquetasProducaoMultiplas` em vez de `gerarPDFEtiquetaProducao`.

### Mudança

**`src/components/production/OrdemDetalhesSheet.tsx`** — função `handleImprimirEtiqueta` (linhas 213-313):

- Calcular `divisor` a partir de `calculo.divisor || 1`
- Se `calculo.etiquetasNecessarias > 1`, gerar array de tags com quantidades parciais (mesma lógica do `handleImprimirTodasEtiquetas`)
- Usar `gerarPDFEtiquetasProducaoMultiplas` para múltiplas tags
- Se apenas 1 etiqueta, manter comportamento atual com `gerarPDFEtiquetaProducao`

Nenhum outro arquivo precisa ser alterado.

