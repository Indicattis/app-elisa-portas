

# Incluir valor_instalacao na coluna "Valor" da lista de vendas da direcao

## Problema
Na pagina `/direcao/vendas`, a coluna "Valor" exibe apenas `valor_venda + valor_credito`, sem incluir `valor_instalacao`. Isso causa inconsistencia com a pagina de detalhes (que acabamos de corrigir) e com o faturamento.

## Solucao

### Arquivo: `src/pages/direcao/FaturamentoDirecao.tsx`

Tres pontos precisam ser atualizados para incluir `valor_instalacao`:

1. **Linha 392 (ordenacao por valor):** Adicionar `valor_instalacao` ao calculo de ordenacao
   - De: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`
   - Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`

2. **Linha 796 (exibicao da coluna "Valor"):** Adicionar `valor_instalacao` ao valor exibido
   - De: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`
   - Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`

3. **Linhas 449 e 493 (indicadores/totalizadores):** Adicionar `valor_instalacao` aos calculos de faturamento total
   - De: `(v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0)`
   - Para: `(v.valor_venda || 0) + (v.valor_credito || 0) + (v.valor_instalacao || 0) - (v.valor_frete || 0)`

