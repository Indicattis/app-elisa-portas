
# Agrupar linhas por porta na Qualidade (como Pintura)

## Objetivo
Na sheet de detalhes em `/producao/qualidade`, as linhas aparecem em lista plana. Vamos agrupá-las por porta (usando `produto_venda_id`), da mesma forma que já é feito para pintura.

## Alteracao

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

Atualmente, a condicao na linha 734 verifica `tipoOrdem === 'pintura'` para decidir se agrupa por porta ou renderiza em lista plana. A mudanca consiste em:

1. Alterar a condicao para `tipoOrdem === 'pintura' || tipoOrdem === 'qualidade'`
2. No bloco de agrupamento, ajustar a filtragem inicial: para pintura, filtra por `requer_pintura !== false`; para qualidade, usa todas as linhas sem filtro
3. Ocultar os campos especificos de pintura (cor, tipo_pintura) quando for qualidade
4. Manter os botoes de "Informar falta/problema" e "Resolver problema" nos itens de qualidade (que existem na renderizacao plana mas nao no bloco de pintura)

### Detalhes tecnicos

- Linha 734: `tipoOrdem === 'pintura'` vira `tipoOrdem === 'pintura' || tipoOrdem === 'qualidade'`
- Linha 738: A filtragem `linhas.filter(l => l.requer_pintura !== false)` precisa condicionar: se pintura, filtra; se qualidade, usa todas as linhas
- Linha 808-812: A exibicao de cor/tipo_pintura sera condicional a `tipoOrdem === 'pintura'`
- Nos itens individuais dentro do grupo (linhas 819-871): adicionar suporte para marcacao de problema e resolucao quando `tipoOrdem === 'qualidade'`, replicando os botoes de AlertTriangle e Check que existem na renderizacao plana (linhas 940-973)
- Adicionar destaque visual para linhas com problema (borda vermelha, icone de alerta) como na renderizacao plana

Nenhum arquivo novo. Apenas `OrdemDetalhesSheet.tsx` sera editado.
