
## Plano: Corrigir fluxo de carregamento de correções e dados do pedido #0088

### Problemas identificados

1. **Código errado (linha 565-571 de `useOrdensCarregamentoUnificadas.ts`)**: Ao concluir o carregamento de uma correção, o código avança o pedido diretamente para `finalizado` — deveria apenas marcar `carregamento_concluido = true` e manter o pedido em `correcoes`. O avanço para finalizado deve ocorrer apenas quando o usuário confirma a conclusão da correção em `/logistica/instalacoes/ordens-instalacoes`.

2. **Movimentação não registrada**: O código tenta chamar uma RPC `registrar_movimentacao_pedido` que não existe, então nenhum histórico é gravado.

3. **Timer errado**: Como o código atualizou `etapa_atual = 'finalizado'` sem reabrir a etapa em `pedidos_etapas`, o cronômetro usa a `data_entrada` antiga (12/02/2026) da etapa `finalizado`.

### Correções

**1. Correção de código — `src/hooks/useOrdensCarregamentoUnificadas.ts`**

Remover as linhas 565-583 (bloco que avança para `finalizado` e tenta registrar movimentação). O carregamento de correção deve apenas atualizar a tabela `correcoes` com `carregamento_concluido = true` — sem tocar em `pedidos_producao` nem `pedidos_etapas`.

Também alterar a mensagem de sucesso (linha 611) de "Pedido finalizado" para "Aguardando conclusão da correção".

**2. Correção de dados — Migration SQL para pedido #0088**

- Devolver `pedidos_producao.etapa_atual` para `correcoes`
- Garantir que `pedidos_etapas` de `correcoes` tenha `data_saida = NULL`
- Garantir que `pedidos_etapas` de `finalizado` não esteja aberta indevidamente
- Registrar movimentação explicando a correção

### Detalhes técnicos

Arquivo `useOrdensCarregamentoUnificadas.ts`, bloco `correcoes` (linhas ~565-583) — será removido inteiramente:
```typescript
// REMOVER: Avançar pedido para finalizado
if (ordem.pedido_id) {
  const { error: pedidoError } = await supabase
    .from("pedidos_producao")
    .update({ etapa_atual: 'finalizado', ... })
    ...
}
```

### Arquivos alterados
- `src/hooks/useOrdensCarregamentoUnificadas.ts` — remover avanço automático para finalizado no carregamento de correções
- Nova migration SQL — corrigir dados do pedido #0088
