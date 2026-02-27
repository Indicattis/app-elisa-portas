

# Corrigir auto-faturamento de pintura epoxi que nao dispara

## Problema

O auto-faturamento de produtos "pintura_epoxi" nao esta funcionando porque o filtro na linha 267 verifica apenas `lucro_item === null || lucro_item === undefined`, mas os produtos vem do banco com `lucro_item: 0`. Como `0` nao e `null` nem `undefined`, o filtro nunca encontra produtos para auto-faturar.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar a linha 267 para incluir `lucro_item === 0` na condicao:

```
// De:
(p.lucro_item === null || p.lucro_item === undefined) &&

// Para:
(p.lucro_item === null || p.lucro_item === undefined || p.lucro_item === 0) &&
```

Isso fara com que produtos de pintura epoxi com lucro zero tambem sejam auto-faturados com a formula (altura x largura) x 25.

