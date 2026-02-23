

# Excluir Contas a Receber Orfas e Prevenir Futuras

## Problema

Ha 15 registros em `contas_receber` que referenciam `venda_id`s inexistentes na tabela `vendas`. Esses registros aparecem como "Venda removida" na interface.

## Solucao

### 1. Limpar dados orfaos existentes

Executar um DELETE para remover os 15 registros orfaos:

```sql
DELETE FROM contas_receber
WHERE venda_id NOT IN (SELECT id FROM vendas);
```

Isso sera feito usando a ferramenta de dados (insert tool), nao migration.

### 2. Criar trigger para exclusao automatica futura

Criar um trigger na tabela `vendas` que, ao excluir uma venda, automaticamente exclua todas as contas a receber associadas. Isso sera feito via migration:

```sql
CREATE OR REPLACE FUNCTION delete_contas_receber_on_venda_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM contas_receber WHERE venda_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_contas_on_venda_delete
BEFORE DELETE ON vendas
FOR EACH ROW
EXECUTE FUNCTION delete_contas_receber_on_venda_delete();
```

### 3. Remover fallback "Venda removida" do codigo

Com os dados orfaos eliminados e o trigger prevenindo novos casos, o fallback "Venda removida" pode ser revertido para o simples "---" ou mantido como seguranca extra. Recomendo manter como esta por precaucao.

## Resumo das acoes

1. DELETE dos 15 registros orfaos (insert tool)
2. Migration com trigger BEFORE DELETE na tabela `vendas`
3. Nenhuma alteracao de codigo necessaria (o fallback existente continua como seguranca)
