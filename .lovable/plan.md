

## Plano: Corrigir avanço de etapa para pedidos em Instalações

### Problema
Quando um pedido está na etapa `instalacoes` e o carregamento já foi concluído, ao clicar "Avançar" o pedido vai para `correcoes` em vez de `finalizado`. Isso acontece porque:

1. A função `getProximaEtapa` usa a ordem linear do array `ORDEM_ETAPAS`, onde `instalacoes` → `correcoes`
2. Existe um override explícito para `aguardando_coleta` → `finalizado` (linha 876), mas **não existe** um equivalente para `instalacoes`

### Solução
Adicionar um override em `src/hooks/usePedidosEtapas.ts` (após a linha 878) para que pedidos saindo de `instalacoes` vão direto para `finalizado`:

```typescript
if (etapaAtualNome === 'instalacoes') {
  etapaDestino = 'finalizado';
  console.log('[moverParaProximaEtapa] Pedido em instalacoes avançando para finalizado');
}
```

### Arquivo alterado
- `src/hooks/usePedidosEtapas.ts` — adicionar bloco condicional ~linha 880

