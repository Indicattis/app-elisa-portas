
# Adicionar Informacoes de Produtos na Downbar de Aprovacoes Fabrica

## O que sera feito

Na secao expandida (downbar) de cada card em `/direcao/aprovacoes/fabrica`, adicionar um resumo visual dos produtos do pedido com:
- Cor da pintura (nome + bolinha colorida)
- Tamanhos das portas de enrolar (largura x altura)
- Nome/descricao dos acessorios e adicionais

## Alteracoes

### 1. `src/hooks/usePedidosAprovacaoCEO.ts`

Adicionar um novo campo `produtosResumo` na interface `PedidoAprovacao` que expoe uma lista tipada dos produtos relevantes:

```ts
produtosResumo: Array<{
  tipo: string;
  nome: string;
  quantidade: number;
  tamanho?: string;
  corNome?: string;
  corHex?: string;
}>
```

No mapeamento dos pedidos, construir essa lista a partir de `produtos_vendas`:
- Para `porta_enrolar`: incluir `tamanho` (ou `largura x altura` formatado)
- Para `pintura_epoxi`: incluir `corNome` e `corHex` do `catalogo_cores`
- Para `acessorio` e `adicional`: incluir `descricao` como nome

### 2. `src/pages/direcao/aprovacoes/AprovacoesProducao.tsx`

Na secao expandida (entre o `border-t` e os botoes de acao), adicionar um bloco de resumo dos produtos:

```
Detalhes expandidos:
  [Resumo de produtos]         <-- NOVO
    - Porta de Enrolar 3,00 x 3,50m (P)
    - Porta de Enrolar 5,00 x 4,00m (G)
    - Pintura Epoxi [bolinha cor] Branco
    - Acessorio: Fechadura Tetra
  [Botao Aprovar]
  [Botao Ver Detalhes]
```

Cada item sera exibido como uma linha compacta com icone, nome, e metadados relevantes (tamanho, cor, descricao).

## Detalhes Tecnicos

- Os dados de `produtos_vendas` ja sao buscados pelo hook (incluindo `catalogo_cores:cor_id`), portanto nao ha query adicional
- Para acessorios/adicionais, o campo `descricao` do `produtos_vendas` contem o nome do item
- O layout dos itens segue o estilo minimalista existente: fundo `bg-muted/50`, borda sutil, texto compacto
- 2 arquivos modificados, nenhum arquivo novo
