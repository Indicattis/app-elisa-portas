
# Corrigir dupla contagem de instalacao na coluna "Valor" da listagem de vendas

## Problema
Na linha 727 de `FaturamentoVendasMinimalista.tsx`, a coluna "Valor" soma `valor_venda + valor_credito + valor_instalacao`. Como `valor_venda` ja inclui o custo de instalacao (via trigger do banco), o valor exibido fica inflado.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`

**Linha 727** - Remover `valor_instalacao` da formula:
- De: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`
- Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`

Isso segue o padrao ja corrigido em outros pontos do sistema.
