

# Adicionar cores das portas ao historico de producao

## Resumo
Exibir a cor das portas de enrolar ao lado de cada ordem no historico em `/producao/meu-historico`, usando o componente `CoresPortasEnrolar` ja existente.

## Alteracoes

### 1. Hook `src/hooks/useMeuHistoricoMinimalista.ts`

Expandir a query do Supabase para buscar as cores dos produtos atraves da cadeia de relacionamentos:

```
ordens_X → pedido:pedidos_producao → venda:vendas → produtos:produtos_vendas → cor:catalogo_cores
```

Alterar o select de:
```
pedido:pedidos_producao(cliente_nome)
```
Para:
```
pedido:pedidos_producao(cliente_nome, venda:vendas(produtos:produtos_vendas(tipo_produto, cor:catalogo_cores(nome, codigo_hex))))
```

Adicionar o campo `cores` (array de `{ nome, codigo_hex }`) ao tipo `OrdemHistoricoMinimalista` e ao mapeamento dos dados retornados. Extrair as cores unicas de portas de enrolar e pintura epoxi dos produtos.

### 2. Componente `src/pages/fabrica/producao/MeuHistoricoMinimalista.tsx`

Na listagem de ordens (dentro do bloco que mostra `#numero_ordem`, badge do setor e `cliente_nome`), adicionar bolinhas coloridas representando as cores das portas, logo apos o nome do cliente. Usar o mesmo estilo visual do `CoresPortasEnrolar` (bolinha redonda com `backgroundColor` do `codigo_hex`), porem em tamanho menor para caber na lista.

A exibicao sera simples: pequenos circulos coloridos (16x16px) com borda, sem texto do nome da cor para manter a lista compacta.

## Detalhes tecnicos

- A cadeia de joins usa os relacionamentos existentes no banco: `pedido_id` liga a `pedidos_producao`, que tem `venda_id` ligando a `vendas`, que tem `produtos_vendas` com `cor_id` ligando a `catalogo_cores`
- As cores serao filtradas para mostrar apenas portas de enrolar e pintura epoxi (mesmo criterio do `CoresPortasEnrolar`)
- Cores duplicadas serao removidas usando um Map por nome
