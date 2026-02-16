

# Corrigir CHECK constraint da tabela linhas_ordens

## Problema
A tabela `linhas_ordens` possui a constraint `linhas_ordens_tipo_ordem_check` na coluna `tipo_ordem` que nao inclui `'embalagem'`. Isso impede a criacao de linhas de ordem quando o pedido avanca para a etapa Embalagem.

## Valores atuais permitidos
soldagem, perfiladeira, separacao, qualidade, pintura, instalacao

## Solucao
Uma migracao SQL que remove e recria a constraint incluindo `'embalagem'`:

```sql
ALTER TABLE linhas_ordens DROP CONSTRAINT linhas_ordens_tipo_ordem_check;

ALTER TABLE linhas_ordens ADD CONSTRAINT linhas_ordens_tipo_ordem_check
  CHECK (tipo_ordem = ANY (ARRAY[
    'soldagem', 'perfiladeira', 'separacao', 'qualidade',
    'pintura', 'instalacao', 'embalagem'
  ]));
```

## Impacto
- Apenas migracao no banco, sem alteracao de codigo
- Apos aplicada, as linhas de ordem de embalagem serao criadas normalmente

