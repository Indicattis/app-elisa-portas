

# Mudar "Selecione a porta" para "Selecione o produto" e agrupar por item vendido

## Contexto

Atualmente, o seletor no editor de linhas do pedido (`PedidoLinhasEditor.tsx`) busca apenas produtos com `tipo_produto` contendo "porta" e usa o label "Selecione a porta". Alem disso, a downbar de producao (`OrdemDetalhesSheet.tsx`) exibe o header como "Porta 01", "Porta 02", etc., mesmo quando o item vendido nao e uma porta.

Os tipos de produto existentes sao: `porta_enrolar`, `porta_social`, `acessorio`, `adicional`, `manutencao`, `pintura_epoxi`.

## Alteracoes

### 1. PedidoLinhasEditor.tsx - Buscar TODOS os produtos da venda

**Query** (linhas 239-254): Remover o filtro `.ilike('tipo_produto', '%porta%')` para que acessorios, adicionais, manutencoes etc. tambem aparecam como opcoes no seletor.

**Labels**: 
- Placeholder do Select: "Selecione o produto" (em vez de "Selecione a porta" / "Porta (opcional)")
- Opcoes do Select: mostrar o `tipo_produto` formatado junto com o indice, ex: "Porta de Enrolar #1 - 4,65m x 6,00m", "Acessorio #1", "Manutencao #1"
- Header de agrupamento na tabela: usar label baseado no tipo do produto em vez de "Porta #X"

**Logica de validacao** (linha 376): Remover a obrigatoriedade de `produto_venda_id` apenas quando `temPortasEnrolar`. Tornar opcional para todos os casos (o usuario pode ou nao associar a um item vendido).

### 2. OrdemDetalhesSheet.tsx - Labels dinamicos na downbar

**Buscar todos os produtos** (linha 742-744): Remover o filtro `tipo_produto === 'porta_enrolar'` para buscar todos os produtos do pedido.

**Header do grupo** (linhas 795-802): Em vez de sempre mostrar "Porta XX", usar label baseado no tipo do produto encontrado:
- `porta_enrolar` -> "Porta de Enrolar 01 - 4,65 x 6,00"
- `porta_social` -> "Porta Social 01 - 0,80 x 2,10"
- `acessorio` -> "Acessorio 01"
- `manutencao` -> "Manutencao 01"
- `adicional` -> "Adicional 01"
- `pintura_epoxi` -> "Pintura Epoxi 01"
- Sem match -> "Item 01"

### 3. expandirPortas.ts - Renomear/adaptar labels

Adaptar `getLabelPortaExpandida` para receber o `tipo_produto` e gerar label adequado (ex: "Acessorio #1" em vez de "Porta #1").

## Detalhes tecnicos

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`
- Remover `.ilike('tipo_produto', '%porta%')` da query de `produtos_vendas` (linha 247)
- Mudar placeholder de "Selecione a porta" para "Selecione o produto" (linha 822)
- Atualizar labels nos `SelectItem` e headers de grupo para refletir o tipo do produto
- Atualizar label "Porta" no Select de edicao inline (linha 558) para "Produto"
- Tornar `produto_venda_id` opcional na validacao (linha 376)

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`
- Remover filtro `tipo_produto === 'porta_enrolar'` (linha 742-744), buscar todos os produtos
- Criar funcao helper para mapear `tipo_produto` para label legivel
- Atualizar header "Porta XX" para usar label dinamico baseado no tipo do produto

### Arquivo: `src/utils/expandirPortas.ts`
- Adicionar parametro opcional `tipo_produto` em `getLabelPortaExpandida`
- Retornar label adequado baseado no tipo (Porta, Acessorio, etc.)

## Arquivos afetados
1. `src/components/pedidos/PedidoLinhasEditor.tsx`
2. `src/components/production/OrdemDetalhesSheet.tsx`
3. `src/utils/expandirPortas.ts`

