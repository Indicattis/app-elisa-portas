
# Correção: Mostrar Campo Tamanho da Linha (não dimensões da porta)

## Problema

Na alteração anterior, priorizei mostrar `largura` x `altura` (dimensões da porta) ao invés do campo `tamanho` da própria linha da ordem. São dados diferentes:
- `tamanho`: campo da linha da ordem (ex: "P", "M", "G" ou outra especificação)
- `largura` x `altura`: dimensões da porta (usadas no cabeçalho do agrupamento)

## Correção

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**Linhas 830-837 - Reverter para mostrar apenas `tamanho`:**

De:
```tsx
<div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
  <span>Qtd: {linha.quantidade}</span>
  {linha.largura && linha.altura && (
    <span>{formatarDimensoes(linha.largura, linha.altura)}</span>
  )}
  {linha.tamanho && !linha.largura && !linha.altura && (
    <span>{formatarTamanho(linha.tamanho)}</span>
  )}
```

Para:
```tsx
<div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
  <span>Qtd: {linha.quantidade}</span>
  {linha.tamanho && (
    <span>{formatarTamanho(linha.tamanho)}</span>
  )}
```

## Resultado

- Cada linha mostrará seu próprio campo `tamanho` (se existir)
- As dimensões da porta continuam aparecendo no cabeçalho do agrupamento (ex: "Porta 01 - 3.00m x 4.00m")
