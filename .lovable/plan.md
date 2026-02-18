
# Reordenar secoes da pagina de detalhes do pedido

## Alteracao

Reorganizar a ordem das secoes em `src/pages/administrativo/PedidoViewMinimalista.tsx` (linhas 462-920) para a seguinte sequencia:

1. **Informacoes do Cliente + Acoes Rapidas** (manter posicao atual)
2. **Produtos da Venda** (mover de ~linha 637 para cima)
3. **Medidas das Portas de Enrolar** (mover de ~linha 628 para depois de Produtos)
4. **Itens do Pedido** (mover de ~linha 791 para depois de Medidas)
5. **Observacoes da visita tecnica** (mover de ~linha 850 para depois de Itens)
6. **Especificacoes Porta Social** (mover de ~linha 879 para depois de Obs visita)
7. **Observacoes do Pedido** (mover de ~linha 588 para baixo)
8. **Ficha de Visita Tecnica** (mover de ~linha 540 para baixo)
9. **Historico de Movimentacoes** (manter posicao relativa)
10. **Fluxograma** (manter posicao relativa)

As secoes "Observacoes da Venda" e "Ordens de Producao" permanecem nas suas posicoes relativas (Obs da Venda pode ficar junto com Obs do Pedido ou logo apos informacoes do cliente).

### Detalhes tecnicos

Apenas reordenacao de blocos JSX no return do componente. Nenhuma logica sera alterada, apenas a ordem de renderizacao dos Cards.
