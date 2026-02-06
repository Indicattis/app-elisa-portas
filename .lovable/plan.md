

# Adicionar coluna "Porta" e agrupar itens por porta no pedido

## Objetivo
Na pagina `/administrativo/pedidos/:id`, na secao "Itens do Pedido", mostrar a qual porta cada item pertence (inclusive em modo somente-leitura) e agrupar os itens por porta de enrolar.

## Alteracoes

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`

1. **Mostrar coluna "Porta" tambem em modo read-only** (linha 503): Remover a condicao `!isReadOnly &&` do header "Porta" e da celula correspondente (linha 533-561), para que a porta seja sempre visivel.

2. **Agrupar linhas por porta**: Em vez de renderizar `linhas.map(...)` diretamente, agrupar as linhas por `produto_venda_id` + `indice_porta` e renderizar com headers visuais separando cada porta:
   - Criar um agrupamento usando chave composta `produto_venda_id_indicePorta`
   - Para cada grupo, exibir um header com badge colorido mostrando "Porta #N - LxA m" com as dimensoes da porta
   - Linhas sem porta associada ficam em um grupo "Sem porta" no final
   - A coluna "Porta" individual nas linhas pode ser removida ou simplificada ja que o header do grupo ja identifica a porta

3. **Buscar portas tambem em modo read-only**: Atualmente a query de portas so roda quando `!isReadOnly` (linha 253: `enabled: !!vendaId && !isReadOnly`). Alterar para `enabled: !!vendaId` para que os dados de portas estejam disponiveis para exibicao.

### Detalhes tecnicos

Na secao de renderizacao (a partir da linha 498), a logica sera:

```
- Agrupar linhas por (produto_venda_id + indice_porta)
- Para cada grupo:
  - Renderizar um <tr> de header com colspan, mostrando "Porta #N - LxA"
  - Renderizar as linhas do grupo normalmente
- Grupo "sem porta" por ultimo
```

A coluna "Porta" no header da tabela sera substituida por um indicador visual no header do grupo, tornando a tabela mais limpa. A coluna de Porta individual pode ser mantida de forma simplificada (apenas o numero) ou removida em favor do agrupamento visual.

## Resultado
Os itens do pedido aparecerao organizados por porta, com um cabecalho visual para cada porta mostrando suas dimensoes, tanto em modo de edicao quanto em modo somente-leitura.
