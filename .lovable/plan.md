

# Corrigir erro "invalid input syntax for type numeric" nas funcoes de metricas

## Problema

As funcoes SQL `get_portas_por_etapa` e `get_desempenho_etapas` calculam metros perfilados com a expressao:

```sql
SUM(lo.quantidade * REPLACE(lo.tamanho, ',', '.')::numeric)
```

Porem, a coluna `linhas_ordens.tamanho` contem valores no formato de dimensoes como `"4.75x6.00"` ou `"4,72x6,00"`. Quando o SQL tenta converter esses valores para `numeric`, ocorre o erro `invalid input syntax for type numeric: "4.75x6.00"`.

## Dados afetados

Existem pelo menos 20 registros com o formato "LARGURAxALTURA" na coluna `tamanho` (ex: `4.75x6.00`, `4,72x6,00`, `3.3x2.8`).

## Solucao

Atualizar ambas as funcoes SQL para extrair apenas o primeiro numero (antes do "x") quando o valor contem "x", usando `SPLIT_PART`. A expressao sera:

```sql
REPLACE(SPLIT_PART(lo.tamanho, 'x', 1), ',', '.')::numeric
```

Isso transforma:
- `"4.75x6.00"` -> `"4.75"` -> `4.75`
- `"4,72x6,00"` -> `"4,72"` -> `"4.72"` -> `4.72`
- `"2.81"` (sem x) -> `"2.81"` -> `2.81` (sem alteracao)

### Detalhes tecnicos

Criar uma nova migration SQL que recria as duas funcoes, alterando apenas a linha do calculo de metros perfilados:

**De:**
```sql
SUM(lo.quantidade * REPLACE(lo.tamanho, ',', '.')::numeric)
```

**Para:**
```sql
SUM(lo.quantidade * REPLACE(SPLIT_PART(lo.tamanho, 'x', 1), ',', '.')::numeric)
```

Essa alteracao aparece em 2 lugares:
1. Na funcao `get_portas_por_etapa` (linha 19 da versao atual)
2. Na funcao `get_desempenho_etapas` (linha 94 da versao atual)

Adicionalmente, incluir um filtro extra para seguranca contra valores inesperados:
```sql
AND lo.tamanho ~ '^\d'
```

Isso garante que apenas valores que comecam com digitos sejam processados.

**Arquivos:** 1 nova migration SQL

