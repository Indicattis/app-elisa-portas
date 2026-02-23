

# Corrigir total de faturamento no DRE mensal

## Problema

A pagina `/direcao/dre/:mes` (DREMesDirecao.tsx) calcula o total de faturamento somando todas as categorias incluindo instalacoes:

```
fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito
```

Isso resulta em R$ 1.308.829,91, mas o valor correto (pela regra padronizada `valor_venda - valor_frete + valor_credito`) deveria ser ~R$ 1.135.229,91.

A diferenca de R$ 173.600 e exatamente o valor das instalacoes (`valor_instalacao`), que esta sendo somado ao total mas nao faz parte da formula padronizada de receita bruta.

## Causa raiz

Na linha 97 do arquivo, `fat.instalacoes` e somado ao total, mas o `valor_instalacao` nao e parte do `valor_venda` (que ja contem a soma dos produtos + frete). Adiciona-lo causa dupla contagem ou inflacao do faturamento.

## Correcao no arquivo `src/pages/direcao/DREMesDirecao.tsx`

### Linha 97 - Remover `fat.instalacoes` do total de faturamento

De:
```typescript
fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito;
```

Para:
```typescript
fat.total = fat.portas + fat.pintura + fat.acessorios + fat.adicionais + totalCredito;
```

A coluna "Instalacoes" continuara sendo exibida na tabela com seu valor individual (R$ 173.600), mas nao sera mais somada ao total de faturamento.

O lucro total (linha 98) permanece inalterado, pois `luc.instalacoes` (lucro de instalacao) e um dado valido que deve compor o lucro.

## Tambem corrigir o DRE overview (`src/pages/direcao/DREDirecao.tsx`)

Nenhuma mudanca necessaria na overview -- ela ja usa a formula correta (`valor_venda + valor_credito - valor_frete`).

## Resultado esperado

- Total faturamento janeiro/2026: ~R$ 1.135.229,91 (consistente com o overview e a regra padronizada)
- Coluna "Instalacoes" continua visivel com seu valor individual
- Lucro total permanece incluindo lucro de instalacao
