
# Corrigir faturamento total: incluir instalações

## Problema

Na linha 411 de `DREMesDirecao.tsx`, o cálculo do faturamento total **não inclui** `fat.instalacoes`:

```typescript
fat.total = fat.portas + fat.pintura + fat.acessorios + fat.adicionais + totalCredito;
```

O valor de instalações é calculado na linha 408 (`fat.instalacoes = totalFatInstalacao`) mas nunca somado ao total.

## Correção

Adicionar `fat.instalacoes` ao cálculo:

```typescript
fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito;
```

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx` (linha 411)
