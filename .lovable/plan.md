

## Plano: Corrigir constraint que bloqueia criação de pedido

### Problema

A tabela `pedidos_producao` tem um CHECK constraint em `etapa_atual` que não inclui o valor `'aprovacao_diretor'`. O hook `usePedidoCreation.ts` tenta inserir com `etapa_atual = 'aprovacao_diretor'`, causando o erro `23514`.

Valores permitidos atualmente:
`aberto, aprovacao_ceo, em_producao, inspecao_qualidade, aguardando_pintura, embalagem, aguardando_coleta, aguardando_instalacao, instalacoes, correcoes, finalizado`

Valor faltante: `aprovacao_diretor`

### Solução

**Migration SQL**: Dropar e recriar o check constraint incluindo `'aprovacao_diretor'`:

```sql
ALTER TABLE pedidos_producao DROP CONSTRAINT pedidos_producao_etapa_atual_check;
ALTER TABLE pedidos_producao ADD CONSTRAINT pedidos_producao_etapa_atual_check 
  CHECK (etapa_atual = ANY (ARRAY[
    'aprovacao_diretor','aberto','aprovacao_ceo','em_producao',
    'inspecao_qualidade','aguardando_pintura','embalagem',
    'aguardando_coleta','aguardando_instalacao','instalacoes',
    'correcoes','finalizado'
  ]));
```

Nenhuma alteração de código necessária.

