

# Fix: Adicionar icone da etapa Embalagem em GestaoFabricaDirecao

## Problema
A pagina `/direcao/gestao-fabrica` esta quebrando porque o mapa `ETAPA_ICONS` (linha 31-42) nao inclui a nova etapa `embalagem`. Quando o componente itera sobre `ORDEM_ETAPAS` (que agora inclui `embalagem`) e tenta renderizar `ETAPA_ICONS['embalagem']`, recebe `undefined`, causando o erro "Element type is invalid".

## Correcao

### Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`

1. Importar o icone `Package` (ja importado na linha 5) -- pode reutilizar ou usar outro icone adequado como `PackageCheck` ou `BoxSelect`.
2. Adicionar `embalagem: Package` ao mapa `ETAPA_ICONS` na linha 38, entre `aguardando_pintura` e `aguardando_coleta`.

Resultado: a tab "Embalagem" aparecera na lista de etapas com o icone correto, sem mais crashes.

