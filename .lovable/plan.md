

# Adicionar tamanhos das portas no agrupamento de Itens do Pedido

## Resumo

Na pagina `/direcao/pedidos/:id`, na secao "Itens do Pedido", os cards de pasta (folders) que representam cada porta ja possuem logica para exibir dimensoes (`grupo.dimensoes`), mas ha cenarios onde as dimensoes podem nao aparecer. O objetivo e garantir que as dimensoes (largura x altura) aparecam sempre de forma clara no agrupamento.

## Alteracoes

### `src/pages/direcao/PedidoViewDirecao.tsx`

1. **Garantir dimensoes nos grupos criados a partir de linhas**: Na logica de agrupamento (linhas 296-304), quando `portasInfo` tem os dados da porta, as dimensoes ja sao definidas. Porem, para os grupos criados a partir de `produtos_venda` (linhas 314-324), as dimensoes ja sao preenchidas tambem. O codigo parece correto.

2. **Tornar as dimensoes mais visiveis no card da pasta**: Atualmente as dimensoes aparecem em texto `text-xs text-white/50` (linha 688), que pode ser pouco visivel. A alteracao sera:
   - Mover as dimensoes para ficar ao lado do label da porta (inline) ou aumentar destaque visual
   - Adicionar as dimensoes como um Badge ou com fonte um pouco maior e cor mais visivel (`text-white/70` em vez de `text-white/50`)

3. **Incluir dimensoes diretamente no label quando disponivel**: Alterar a construcao do `grupo.label` para incluir as dimensoes inline, exemplo: `"Porta de Enrolar #1"` com dimensoes `"2.80m x 3.00m"` exibidas como badge ou texto destacado logo abaixo.

4. **Buscar largura e altura diretamente do `produtos_vendas`**: Para os grupos que vem de `produtos_venda` sem linhas, as dimensoes ja sao buscadas. Para os que vem de linhas, a busca em `portasInfo` ja acontece. Nenhuma alteracao de query necessaria.

## Detalhes tecnicos

- Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`
- Linhas afetadas: ~686-692 (card da pasta no grid de agrupamento)
- Alteracao: melhorar visibilidade do `grupo.dimensoes` existente, possivelmente usando um `Badge` com estilo mais destacado ou aumentando o tamanho/cor do texto das dimensoes

