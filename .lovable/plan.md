
# Exibir portas sociais na secao "Itens do Pedido" em PedidoViewDirecao

## Problema atual
Na pagina `/direcao/pedidos/:id`, a secao "Itens do Pedido" so exibe pastas (folders) para produtos que possuem linhas de pedido (`pedido_linhas`) associadas. Portas sociais geralmente nao possuem linhas de producao vinculadas, entao nao aparecem nesta secao.

## Solucao
Alterar a logica de agrupamento (`gruposPortas`) para tambem incluir pastas para produtos da venda que nao possuem linhas, especialmente portas sociais. Isso garante que todas as portas aparecem como folders na grid, mesmo sem itens de producao, exibindo informacoes uteis como tipo, dimensoes e cor.

## Alteracoes

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

1. **Expandir o `gruposPortas` (useMemo)** para, alem de agrupar linhas existentes por porta, tambem criar pastas vazias para todos os `produtos_venda` do pedido que ainda nao possuem linhas. Isso segue o mesmo padrao ja usado no `PedidoLinhasEditor` (linhas 469-476), garantindo que portas sociais (e qualquer outro produto) aparecam como folders.

2. **Usar `produtos_venda` para enriquecer as informacoes das pastas** -- ao inves de depender apenas do `portasInfo` (que so contem portas referenciadas pelas linhas), buscar tipo, dimensoes e cor diretamente de `produtos_venda`. Isso permite exibir detalhes completos na pasta, incluindo a cor da porta social.

3. **Exibir informacao de "Somente exibicao"** -- quando uma pasta nao tiver linhas, mostrar uma mensagem como "Nenhum item de producao vinculado" dentro da pasta expandida, deixando claro que e apenas informativa.

4. **Renumerar corretamente** -- ajustar a numeracao sequencial para incluir as novas pastas na contagem por tipo (ex: "Porta Social #1").

### Detalhes tecnicos

```text
Antes (gruposPortas):
  Itera apenas pedido.linhas
  Cria folders somente para produto_venda_ids presentes nas linhas
  Porta social sem linhas = nao aparece

Depois (gruposPortas):
  1. Itera pedido.linhas (agrupa como antes)
  2. Itera pedido.produtos_venda (cria folders vazios para os que faltam)
  Porta social sem linhas = aparece como folder vazio com info do produto
```

A pasta vazia da porta social exibira cor, dimensoes (se houver), e a badge "0 itens" -- informando o usuario que nao ha itens de producao, mas mostrando o produto no contexto do pedido.
