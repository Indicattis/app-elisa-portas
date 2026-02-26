
# Investigacao e Correcoes nos Pedidos

## Diagnostico

Os dois pedidos (`5ee4873b` e `f57b1e16`) **nunca foram arquivados com sucesso**:
- `arquivado = false`, `data_arquivamento = null` em ambos
- Ambos estao na etapa `instalacoes` com carregamento ja concluido
- O botao de arquivar so funciona para pedidos na etapa `finalizado` (filtro `.eq('etapa_atual', 'finalizado')` no codigo)
- O usuario provavelmente tentou arquivar, mas a operacao falhou silenciosamente ou nao estava disponivel

## Correcoes Necessarias

### 1. Registrar movimentacao ao arquivar pedido

**Arquivo:** `src/hooks/usePedidosEtapas.ts`

Na mutation `arquivarPedido` (linha ~1485), apos o update bem-sucedido, inserir um registro em `pedidos_movimentacoes`:

```typescript
await supabase.from('pedidos_movimentacoes').insert({
  pedido_id: pedidoId,
  user_id: user.id,
  etapa_origem: 'finalizado',
  etapa_destino: 'finalizado',
  teor: 'avanco',
  descricao: 'Pedido arquivado'
});
```

### 2. Corrigir dados dos dois pedidos via SQL

Usar o insert tool para atualizar os dois pedidos para a etapa correta (`finalizado`), ja que o carregamento foi concluido ha dias:

- Atualizar `pedidos_producao.etapa_atual` para `finalizado`
- Criar registro em `pedidos_etapas` para a etapa `finalizado`
- Registrar movimentacao de avanco `instalacoes -> finalizado` em `pedidos_movimentacoes`

### 3. Adicionar tipo 'arquivamento' nas movimentacoes (opcional melhor)

Para que o historico fique mais claro, seria ideal adicionar o teor `'arquivamento'` ao constraint `teor_check` da tabela `pedidos_movimentacoes`, com icone e label proprios no componente `PedidoHistoricoMovimentacoes.tsx`. Porem, como o constraint atual permite apenas `avanco`, `backlog`, `reorganizacao`, `criacao`, usaremos `avanco` com descricao explicativa por ora.

## Resultado Esperado

- Pedidos `5ee4873b` e `f57b1e16` serao movidos para `finalizado` e poderao ser arquivados normalmente
- Toda vez que um pedido for arquivado, uma movimentacao aparecera no historico com a descricao "Pedido arquivado"
- O historico em `/direcao/pedidos/:id` mostrara todas as movimentacoes incluindo arquivamentos
