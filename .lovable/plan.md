
# Excluir ordens de embalagem de pedidos sem pintura

## Situacao
Existem 4 ordens de embalagem criadas incorretamente para pedidos que nao possuem pintura. Todas estao com status "pendente" e os pedidos ja avancaram para etapas posteriores (instalacoes/aguardando_coleta), portanto sao orfas.

| Pedido | Ordem ID | Linhas | Etapa Atual |
|--------|----------|--------|-------------|
| 0194   | 5d810ff8... | 4 | instalacoes |
| 0217   | 4c1a6784... | 1 | aguardando_coleta |
| 0216   | 1c7f8a65... | 1 | instalacoes |
| 0189   | 60379f47... | 3 | aguardando_coleta |

## Alteracao

### Migracao SQL

1. Deletar as linhas associadas em `linhas_ordens` (tipo_ordem = 'embalagem') para essas 4 ordens
2. Deletar as 4 ordens de `ordens_embalagem`

A query identifica ordens de embalagem nao-historicas cujos pedidos nao possuem nenhum produto com `valor_pintura > 0`.

```sql
-- Deletar linhas das ordens
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'embalagem'
AND ordem_id IN (
  SELECT oe.id FROM ordens_embalagem oe
  JOIN pedidos_producao pp ON pp.id = oe.pedido_id
  LEFT JOIN vendas v ON v.id = pp.venda_id
  LEFT JOIN produtos_vendas pv ON pv.venda_id = v.id AND pv.valor_pintura > 0
  WHERE pv.id IS NULL AND oe.historico = false
);

-- Deletar ordens
DELETE FROM ordens_embalagem
WHERE historico = false
AND id IN (
  SELECT oe.id FROM ordens_embalagem oe
  JOIN pedidos_producao pp ON pp.id = oe.pedido_id
  LEFT JOIN vendas v ON v.id = pp.venda_id
  LEFT JOIN produtos_vendas pv ON pv.venda_id = v.id AND pv.valor_pintura > 0
  WHERE pv.id IS NULL
);
```

### Arquivo afetado
- **Novo:** Migracao SQL para limpeza dos dados
