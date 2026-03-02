

# Corrigir calculo do "Valor a Receber" / Geracao de Parcelas

## Problema

Na funcao `handleGerarParcelas` (linha 151 de `FaturamentoVendaMinimalista.tsx`), o valor total usado para gerar as parcelas esta com dupla contagem:

```typescript
const valorTotal = (venda.valor_venda || 0) + (venda.valor_instalacao || 0);
```

Como `valor_venda` ja inclui instalacao, isso gera parcelas com valor inflado (ex: R$ 26.100 em vez de R$ 21.500).

Alem disso, a validacao de totais (linha 1145) compara as parcelas apenas contra `valor_venda`, sem incluir `valor_credito`.

## Alteracoes

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**Linha 151** - Corrigir formula do valor total para geracao de parcelas:
- De: `(venda.valor_venda || 0) + (venda.valor_instalacao || 0)`
- Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`

**Linhas 1145-1146** - Corrigir validacao de total de parcelas para incluir credito:
- De: `const valorVenda = venda.valor_venda || 0;`
- Para: `const valorVenda = (venda.valor_venda || 0) + (venda.valor_credito || 0);`

Nota: As parcelas ja existentes no banco nao serao corrigidas automaticamente. Se necessario, o usuario pode remover e gerar novamente.
