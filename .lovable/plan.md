
# Plano: Corrigir Erro de Duplicidade ao Avançar Pedidos

## Problema Identificado
O código atual faz `INSERT` direto na tabela `pedidos_etapas` (linha 678-686) sem considerar que:
1. Um pedido pode revisitar a mesma etapa (ex: voltou de inspecao_qualidade para em_producao e agora precisa voltar)
2. A constraint UNIQUE `(pedido_id, etapa)` bloqueia INSERTs duplicados

## Solucao

### Modificar `src/hooks/usePedidosEtapas.ts`

Substituir o INSERT simples por UPSERT com ON CONFLICT. Quando ja existir um registro para essa combinacao `(pedido_id, etapa)`:
- Limpar o `data_saida` (marcando como etapa ativa novamente)
- Atualizar os checkboxes para o estado inicial
- Atualizar `data_entrada` para agora

**Codigo atual (linha 678-686):**
```typescript
const { error: etapaError } = await supabase
  .from('pedidos_etapas')
  .insert({
    pedido_id: pedidoId,
    etapa: etapaDestino,
    checkboxes: checkboxesNovos as any
  });
```

**Codigo corrigido:**
```typescript
const { error: etapaError } = await supabase
  .from('pedidos_etapas')
  .upsert({
    pedido_id: pedidoId,
    etapa: etapaDestino,
    checkboxes: checkboxesNovos as any,
    data_entrada: new Date().toISOString(),
    data_saida: null  // Limpar data_saida para marcar como ativa
  }, {
    onConflict: 'pedido_id,etapa'
  });
```

### Locais para aplicar a correcao

1. **Linha ~678-686** - `moverParaProximaEtapa` (avanco normal)
2. **Linha ~830-840** - `criarOrdensEAvancar` (se houver INSERT similar)
3. Verificar se ha outros pontos de INSERT em `pedidos_etapas`

## Beneficios
- Pedidos que revisitam etapas funcionarao corretamente
- O historico de passagens anteriores e preservado (com data_saida preenchido)
- A nova passagem tera data_entrada atualizada e data_saida null

## Arquivos a Modificar
| Arquivo | Acao |
|---------|------|
| `src/hooks/usePedidosEtapas.ts` | Substituir INSERT por UPSERT com onConflict |

## Correcao Imediata dos Pedidos Travados
Apos aplicar a correcao no codigo, o botao "Verificar Avanco" funcionara. Os pedidos 24 e 8 poderao ser avancados normalmente clicando no botao.
