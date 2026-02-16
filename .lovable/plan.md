
# Adicionar tooltip com datas no cronometro do pedido

## Objetivo
Ao passar o mouse sobre o badge de tempo total do pedido (o cronometro que mostra "ha X dias") na pagina /direcao/gestao-fabrica, exibir um tooltip com 4 datas importantes.

## Dados disponiveis

| Informacao | Fonte | Ja disponivel no PedidoCard? |
|---|---|---|
| Data da venda | `vendas.created_at` (via `pedido.vendas`) | Sim - ja vem na query |
| Data do faturamento | Nao existe campo especifico. O pedido e criado quando a venda e faturada, entao `pedido.created_at` serve como proxy | Sim |
| Data do pedido criado | `pedido.created_at` | Sim |
| Data entrada etapa atual | `pedidos_etapas.data_entrada` (etapa sem data_saida) | Sim - ja calculado como `dataEntradaEtapaAtual` |

## Alteracao em `src/components/pedidos/PedidoCard.tsx`

### Envolver o Badge de tempo total com Tooltip
Nos dois locais onde o badge de tempo total aparece (linhas 1425-1430 para desktop/list e linhas 1701-1706 para mobile/compact), envolver o Badge existente com os componentes `Tooltip`, `TooltipTrigger` e `TooltipContent`.

O conteudo do tooltip sera:
```
Venda criada: dd/MM/yyyy as HH:mm
Faturada: dd/MM/yyyy as HH:mm
Pedido criado: dd/MM/yyyy as HH:mm
Etapa atual: dd/MM/yyyy as HH:mm
```

### Implementacao
- Reutilizar os componentes `Tooltip/TooltipTrigger/TooltipContent` ja importados no arquivo
- Usar `format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })` para formatacao (ja importado)
- As datas serao extraidas de:
  - `venda?.created_at` para data da venda
  - `pedido.created_at` para data do faturamento/pedido (sao efetivamente o mesmo momento)
  - `dataEntradaEtapaAtual` para data de entrada na etapa atual

## Arquivo alterado
- `src/components/pedidos/PedidoCard.tsx` - adicionar tooltip nos 2 locais do badge de tempo total

## Observacao tecnica
Nao existe um campo `data_faturamento` no banco de dados. O faturamento e marcado por um boolean em cada produto. A data de criacao do pedido (`pedido.created_at`) e o melhor indicador de quando a venda foi faturada, pois o pedido e gerado automaticamente apos o faturamento completo.
