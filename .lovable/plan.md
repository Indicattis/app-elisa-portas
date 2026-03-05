

# Propagar alterações do cliente para vendas e tabelas relacionadas

## Problema
Quando o nome ou telefone do cliente é atualizado na tabela `clientes`, as tabelas `vendas`, `pedidos_producao` e `instalacoes_cadastradas` mantêm os dados antigos pois armazenam cópias desnormalizadas (`cliente_nome`, `cliente_telefone`, etc.).

## Solução
Criar um **trigger no banco de dados** na tabela `clientes` que, ao detectar alteração no nome ou telefone, propaga automaticamente para todas as tabelas relacionadas via `cliente_id` ou `venda_id`.

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.propagar_alteracao_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar vendas vinculadas ao cliente
  IF OLD.nome IS DISTINCT FROM NEW.nome OR OLD.telefone IS DISTINCT FROM NEW.telefone THEN
    UPDATE public.vendas
    SET 
      cliente_nome = COALESCE(NEW.nome, cliente_nome),
      cliente_telefone = COALESCE(NEW.telefone, cliente_telefone)
    WHERE cliente_id = NEW.id;

    -- Atualizar pedidos_producao via vendas
    UPDATE public.pedidos_producao pp
    SET
      cliente_nome = COALESCE(NEW.nome, pp.cliente_nome),
      cliente_telefone = COALESCE(NEW.telefone, pp.cliente_telefone)
    FROM public.vendas v
    WHERE pp.venda_id = v.id AND v.cliente_id = NEW.id;

    -- Atualizar instalacoes_cadastradas via vendas
    UPDATE public.instalacoes_cadastradas ic
    SET
      nome_cliente = COALESCE(NEW.nome, ic.nome_cliente),
      telefone_cliente = COALESCE(NEW.telefone, ic.telefone_cliente)
    FROM public.vendas v
    WHERE ic.venda_id = v.id AND v.cliente_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_propagar_alteracao_cliente
AFTER UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.propagar_alteracao_cliente();
```

### Tabelas afetadas (somente dados, sem mudança de schema)
- `vendas` → campos `cliente_nome`, `cliente_telefone`
- `pedidos_producao` → campos `cliente_nome`, `cliente_telefone`
- `instalacoes_cadastradas` → campos `nome_cliente`, `telefone_cliente`

### Arquivo
- Nenhum arquivo de código precisa ser alterado -- a propagação acontece inteiramente no banco via trigger.

