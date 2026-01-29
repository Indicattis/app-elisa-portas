
# Plano: Corrigir Erro de Coluna Inexistente ao Retroceder Pedido

## Problema Identificado

Ao tentar retroceder um pedido para a etapa "Em Produção", o sistema retorna o erro:

```
column v.valor_pintura does not exist
```

## Causa Raiz

A função SQL `retroceder_pedido_unificado` contém uma referência incorreta. Na linha 37, ela tenta acessar `v.valor_pintura` na tabela `vendas`:

```sql
SELECT EXISTS(
  SELECT 1 FROM vendas v
  JOIN pedidos_producao p ON p.venda_id = v.id
  WHERE p.id = p_pedido_id
  AND (v.valor_pintura > 0 OR EXISTS(...))  -- ❌ v.valor_pintura NÃO EXISTE
) INTO v_tem_pintura;
```

**Contexto**: A coluna `valor_pintura` foi removida da tabela `vendas` na migração `20251007164422` porque os valores de pintura agora estão na tabela `produtos_vendas` (itens individuais da venda).

---

## Estrutura Atual das Tabelas

| Tabela | Coluna valor_pintura |
|--------|---------------------|
| vendas | **NÃO EXISTE** (removida) |
| produtos_vendas | **SIM** (existe) |

---

## Solução

Atualizar a função `retroceder_pedido_unificado` para verificar a existência de pintura consultando a tabela `produtos_vendas` ao invés de `vendas`.

### Código Atual (Incorreto)

```sql
SELECT EXISTS(
  SELECT 1 FROM vendas v
  JOIN pedidos_producao p ON p.venda_id = v.id
  WHERE p.id = p_pedido_id
  AND (v.valor_pintura > 0 OR EXISTS(
    SELECT 1 FROM produtos_vendas pv 
    WHERE pv.venda_id = v.id AND pv.tipo_produto = 'pintura_epoxi'
  ))
) INTO v_tem_pintura;
```

### Código Corrigido

```sql
SELECT EXISTS(
  SELECT 1 FROM pedidos_producao p
  WHERE p.id = p_pedido_id
  AND EXISTS(
    SELECT 1 FROM produtos_vendas pv 
    WHERE pv.venda_id = p.venda_id 
    AND (pv.valor_pintura > 0 OR pv.tipo_produto = 'pintura_epoxi')
  )
) INTO v_tem_pintura;
```

**Mudanças**:
1. Remove a referência direta a `vendas v` (já que não precisamos de colunas dela)
2. Consulta diretamente `pedidos_producao` 
3. Move a verificação de `valor_pintura` para a subconsulta em `produtos_vendas`

---

## Alteração Necessária

### Nova Migração SQL

Criar uma migração que substitui a função com a query corrigida:

```sql
CREATE OR REPLACE FUNCTION public.retroceder_pedido_unificado(...)
RETURNS JSONB
LANGUAGE plpgsql
...
AS $$
DECLARE
  ...
BEGIN
  -- Buscar etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  -- CORREÇÃO: Verificar pintura em produtos_vendas
  SELECT EXISTS(
    SELECT 1 FROM pedidos_producao p
    WHERE p.id = p_pedido_id
    AND EXISTS(
      SELECT 1 FROM produtos_vendas pv 
      WHERE pv.venda_id = p.venda_id 
      AND (pv.valor_pintura > 0 OR pv.tipo_produto = 'pintura_epoxi')
    )
  ) INTO v_tem_pintura;

  -- Resto da função permanece igual...
END;
$$;
```

---

## Resumo

| Arquivo/Recurso | Alteração |
|-----------------|-----------|
| Migração SQL | Atualizar função `retroceder_pedido_unificado` para consultar `produtos_vendas` ao invés de `vendas` |

---

## Impacto

- **Correção imediata**: Retrocesso de pedidos funcionará sem erros
- **Lógica preservada**: A verificação de pintura continua funcionando, apenas consultando a tabela correta
- **Sem breaking changes**: Demais funcionalidades não são afetadas
