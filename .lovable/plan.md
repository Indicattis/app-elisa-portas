
# Detalhes da Ordem no Historico de Producao

## O que muda

Ao clicar em uma ordem na pagina `/producao/meu-historico`, abrira um painel lateral (Sheet) mostrando:
- Informacoes do pedido (numero, cliente, observacoes, data de entrega, endereco)
- Lista de itens/linhas da ordem com detalhes (produto, quantidade, tamanho, dimensoes, status)

## Alteracoes

### 1. Novo componente: `src/components/production/HistoricoOrdemDetalhesSheet.tsx`

Um Sheet simplificado e somente-leitura com:
- Header: numero da ordem, setor (badge colorido), tempo de conclusao
- Secao "Pedido": numero do pedido, cliente, data de entrega, endereco, observacoes (buscado de `pedidos_producao` via query)
- Secao "Itens": lista de linhas da ordem usando o hook `useLinhasOrdem` ja existente, mostrando nome do produto, quantidade, tamanho, dimensoes (largura x altura) e status (concluida/com problema)

Dados buscados:
- Linhas: reutiliza `useLinhasOrdem(ordemId, setor)` que ja existe
- Pedido: query simples ao `pedidos_producao` pelo `pedido_id` da ordem, trazendo `numero_pedido`, `cliente_nome`, `cliente_telefone`, `data_entrega`, `endereco_rua`, `endereco_numero`, `endereco_bairro`, `endereco_cidade`, `observacoes`

### 2. Alteracao em `src/pages/ProducaoMeuHistorico.tsx`

- Adicionar estado `ordemSelecionada` (armazena a ordem clicada ou `null`)
- Tornar cada item da lista clicavel (cursor pointer, onClick para setar a ordem selecionada)
- Renderizar o `HistoricoOrdemDetalhesSheet` passando a ordem selecionada

```
Fluxo:
  Usuario clica na ordem
    -> setOrdemSelecionada(ordem)
    -> Sheet abre
    -> useLinhasOrdem busca as linhas
    -> useQuery busca dados do pedido
    -> Exibe tudo no Sheet
```

### 3. Nenhuma alteracao nos hooks existentes

O `useLinhasOrdem` ja aceita `ordemId` e `tipoOrdem` (que corresponde ao setor). O `useMeuHistoricoProducao` ja retorna `pedido_id` e `setor` necessarios.
