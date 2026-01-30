
# Plano: Adicionar Tamanho dos Itens nas Ordens de Pintura

## Problema Identificado

Na página `/producao/pintura`, ao visualizar os detalhes de uma ordem de pintura, as linhas dos itens não mostram as dimensões (largura x altura). O código já busca esses dados, mas não os exibe.

**Situação atual:**
- Os dados `largura` e `altura` JÁ SÃO BUSCADOS no hook `useOrdemPintura.ts` (linhas 120-121)
- No entanto, a exibição no `OrdemDetalhesSheet.tsx` só mostra `linha.tamanho` (que geralmente está vazio)

## Solução

Modificar a exibição dos itens para mostrar as dimensões quando disponíveis.

## Alterações Técnicas

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**1. Linha 830-838 (itens dentro do agrupamento por porta para pintura):**

Antes:
```tsx
<div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
  <span>Qtd: {linha.quantidade}</span>
  {linha.tamanho && <span>{formatarTamanho(linha.tamanho)}</span>}
  ...
</div>
```

Depois:
```tsx
<div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
  <span>Qtd: {linha.quantidade}</span>
  {linha.largura && linha.altura && (
    <span>{formatarDimensoes(linha.largura, linha.altura)}</span>
  )}
  {linha.tamanho && !linha.largura && !linha.altura && (
    <span>{formatarTamanho(linha.tamanho)}</span>
  )}
  ...
</div>
```

**Lógica:**
- Se tem `largura` E `altura` → mostra dimensões formatadas (ex: "2.80m x 3.00m")
- Se não tem dimensões mas tem `tamanho` → mostra tamanho (fallback)

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Qtd: 1 | Qtd: 1 • 2.80m x 3.00m |
| Qtd: 2 | Qtd: 2 • 3.50m x 4.00m |

## Observação

A função `formatarDimensoes` já está importada no arquivo (linha 33), então não é necessário adicionar nenhuma nova importação.
