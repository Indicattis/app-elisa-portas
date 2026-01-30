
# Plano: Corrigir Constraint na Tabela estoque_conferencia_itens

## Problema Identificado

O código em `useConferenciaEstoque.ts` (linha 150) insere `quantidade_conferida: null` ao criar os itens da conferência, pois itens ainda não foram conferidos. Porém, a coluna no banco de dados possui constraint NOT NULL.

```typescript
// Linha 150 - Código atual
quantidade_conferida: null as number | null,
```

**Erro do Postgres:**
```
null value in column "quantidade_conferida" of relation "estoque_conferencia_itens" violates not-null constraint
```

## Solução

Alterar a coluna `quantidade_conferida` para permitir valores NULL, já que:
- NULL = item ainda não conferido
- Número = quantidade verificada pelo conferente

## Alteração Necessária

### Migração SQL

```sql
ALTER TABLE estoque_conferencia_itens 
ALTER COLUMN quantidade_conferida DROP NOT NULL;
```

## Arquivos

| Arquivo | Ação |
|---------|------|
| Banco de dados | Migração para tornar coluna nullable |

Nenhuma alteração de código é necessária - o código já está correto para trabalhar com valores NULL.

## Resultado Esperado

- Iniciar conferência funciona corretamente
- Itens começam com `quantidade_conferida = NULL`
- Ao conferir, usuário preenche a quantidade real
- Diferença é calculada apenas quando `quantidade_conferida` não é NULL
