
# Agrupamento por porta em TODAS as paginas de producao

## Problema atual

O agrupamento por porta na downbar so funciona para Pintura e Qualidade (condicao na linha 735 do `OrdemDetalhesSheet.tsx`). Alem disso, a coluna `indice_porta` esta NULL para praticamente todas as linhas de soldagem, perfiladeira e separacao no banco de dados, e a funcao SQL de criacao de ordens nao copia esse campo.

## Alteracoes necessarias

### 1. Frontend - Habilitar agrupamento para todos os tipos

**Arquivo**: `src/components/production/OrdemDetalhesSheet.tsx`

- Remover a condicao `(tipoOrdem === 'pintura' || tipoOrdem === 'qualidade')` na linha 735
- Usar o agrupamento por porta para TODOS os tipos de ordem (soldagem, perfiladeira, separacao, qualidade, pintura)
- Manter o fallback "sem_porta" para linhas sem `produto_venda_id`

### 2. SQL - Corrigir funcao `criar_ordens_producao_automaticas`

**Migration SQL**: Recriar a funcao adicionando `indice_porta` nas colunas do INSERT para soldagem, perfiladeira e separacao:

```
INSERT INTO linhas_ordens (..., indice_porta)
SELECT ..., pl.indice_porta
FROM pedido_linhas pl ...
```

### 3. SQL - Backfill dos dados existentes

Atualizar as linhas existentes que possuem `pedido_linha_id` (a maioria tem), copiando o `indice_porta` de `pedido_linhas`:

```sql
UPDATE linhas_ordens lo
SET indice_porta = pl.indice_porta
FROM pedido_linhas pl
WHERE lo.pedido_linha_id = pl.id
  AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
  AND lo.indice_porta IS NULL
  AND pl.indice_porta IS NOT NULL;
```

Este UPDATE e seguro pois usa `pedido_linha_id` (chave unica), diferente do backfill anterior que usava `estoque_id` (nao unico).

## Arquivos afetados

1. `src/components/production/OrdemDetalhesSheet.tsx` - remover condicao de tipo
2. Nova migration SQL - corrigir funcao + backfill de `indice_porta`
