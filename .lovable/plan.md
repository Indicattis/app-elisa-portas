

# Corrigir erro "invalid input syntax for type integer" na quantidade de produtos

## Problema
A coluna `quantidade` na tabela `produtos_vendas` e do tipo `integer`, mas produtos do catalogo medidos em metros enviam valores decimais (ex: `4.08`). Isso causa o erro ao tentar inserir a venda.

## Solucao

### 1. Migracao SQL
Alterar o tipo da coluna `quantidade` de `integer` para `numeric` na tabela `produtos_vendas`:

```sql
ALTER TABLE produtos_vendas ALTER COLUMN quantidade TYPE numeric USING quantidade::numeric;
```

Isso preserva todos os dados existentes (inteiros sao validos como numeric) e passa a aceitar decimais.

### 2. Atualizar tipos TypeScript
O arquivo `src/integrations/supabase/types.ts` sera atualizado automaticamente apos a migracao. Nenhuma mudanca manual no codigo e necessaria, pois a linha 331 de `useVendas.ts` ja passa `produto.quantidade` diretamente -- o valor decimal simplesmente sera aceito pelo banco.

### Arquivos envolvidos
- Migracao SQL (alterar tipo da coluna)
- Nenhuma alteracao de codigo frontend necessaria

