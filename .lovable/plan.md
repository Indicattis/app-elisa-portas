
## Plano: Corrigir função `retornar_pedido_para_producao` para registrar movimentação no histórico

### Diagnóstico

O pedido `08e4eddf` mostra duas movimentações `em_producao → inspecao_qualidade` sem um retrocesso entre elas. A causa:

1. **08/04 17:12** — Pedido avançou para `inspecao_qualidade` (registrado corretamente via `moverParaProximaEtapa`)
2. **08/04 19:35** — Pedido retornou para `em_producao` via função SQL `retornar_pedido_para_producao` (chamada pelo modal "Retornar para Produção" na tela de Qualidade). **Essa função NÃO insere na tabela `pedidos_movimentacoes`** — apenas faz UPSERT em `pedidos_etapas` e UPDATE em `pedidos_producao`.
3. **10/04 19:33** — Pedido avançou novamente para `inspecao_qualidade` (registrado corretamente)

Resultado: o histórico mostra 2 avanços sem retrocesso no meio.

A função `retroceder_pedido_unificado` registra a movimentação corretamente (linha 166 da migration). Mas `retornar_pedido_para_producao` não tem esse INSERT.

### Correção

**Migration SQL** — Adicionar `INSERT INTO pedidos_movimentacoes` na função `retornar_pedido_para_producao` (overload jsonb), logo antes do fechamento de etapa:

```sql
INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
VALUES (p_pedido_id, 'inspecao_qualidade', 'em_producao', p_user_id, 'backlog', p_motivo);
```

Para ser mais robusto, buscar a `etapa_atual` do pedido antes de inserir (em vez de hardcodar `inspecao_qualidade`):

```sql
DECLARE
  v_etapa_atual TEXT;
BEGIN
  SELECT etapa_atual INTO v_etapa_atual FROM pedidos_producao WHERE id = p_pedido_id;
  
  -- ... código existente ...
  
  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (p_pedido_id, v_etapa_atual, 'em_producao', p_user_id, 'backlog', p_motivo);
```

Também corrigir o overload com `text[]` (primeira versão da função) da mesma forma.

### Arquivo alterado
- Migration SQL para recriar `retornar_pedido_para_producao` com registro de movimentação
