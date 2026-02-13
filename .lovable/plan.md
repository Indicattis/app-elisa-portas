
# Auto-ordenar pedidos por cor na etapa "Aguardando Pintura"

## Objetivo
Quando um pedido entra na etapa "Aguardando Pintura", ele deve se posicionar automaticamente abaixo do ultimo pedido com a mesma cor, agrupando pedidos por cor.

## Solucao

Duas alteracoes no arquivo `src/hooks/usePedidosEtapas.ts`:

### 1. Calcular prioridade automatica ao avancar para "aguardando_pintura"

Na funcao `moverParaProximaEtapa`, quando `etapaDestino === 'aguardando_pintura'`, em vez de setar `prioridade_etapa: 0`, calcular a prioridade ideal:

- Buscar todos os pedidos atuais em `aguardando_pintura` com suas cores e prioridades
- Identificar a cor do pedido que esta sendo movido
- Encontrar o ultimo pedido (menor prioridade) com a mesma cor
- Atribuir uma prioridade logo abaixo dele

Se nao houver nenhum pedido com a mesma cor, posicionar no final da lista (prioridade minima).

### 2. Aplicar ordenacao por cor como desempate (seguranca)

No `useQuery` que busca pedidos por etapa, adicionar logica de ordenacao para `aguardando_pintura` similar a que ja existe para `aberto` (linhas 325-343). A prioridade manual continua tendo precedencia, mas pedidos com mesma prioridade serao ordenados por cor.

## Detalhes tecnicos

### Arquivo: `src/hooks/usePedidosEtapas.ts`

**Alteracao 1 - Linhas 764-774 (atualizar pedido ao avancar)**

Antes de fazer o update do pedido, quando `etapaDestino === 'aguardando_pintura'`:

```typescript
let novaPrioridade = 0;

if (etapaDestino === 'aguardando_pintura') {
  // Buscar pedidos atuais na etapa com suas cores
  const { data: pedidosNaEtapa } = await supabase
    .from('pedidos_producao')
    .select(`
      id, prioridade_etapa,
      vendas:venda_id (
        produtos_vendas (
          cor:catalogo_cores (nome)
        )
      )
    `)
    .eq('etapa_atual', 'aguardando_pintura')
    .eq('arquivado', false)
    .order('prioridade_etapa', { ascending: false });

  // Extrair cor do pedido atual (via venda)
  const { data: pedidoAtual } = await supabase
    .from('pedidos_producao')
    .select(`vendas:venda_id (produtos_vendas (cor:catalogo_cores (nome)))`)
    .eq('id', pedidoId)
    .single();

  const corAtual = /* extrair primeira cor do pedidoAtual */;

  // Encontrar posicao ideal: logo apos o ultimo pedido com mesma cor
  // Atribuir prioridade calculada
}

// No update:
.update({
  etapa_atual: etapaDestino,
  status: '...',
  prioridade_etapa: novaPrioridade
})
```

**Alteracao 2 - Linhas 325-345 (ordenacao no useQuery)**

Adicionar bloco para `aguardando_pintura` com mesma logica de desempate por cor:

```typescript
if (etapa === 'aguardando_pintura') {
  return pedidosComBacklog.sort((a, b) => {
    const prioA = (a as any).prioridade_etapa || 0;
    const prioB = (b as any).prioridade_etapa || 0;
    if (prioB !== prioA) return prioB - prioA;

    // Desempate por cor (alfabetica)
    const corA = extrairPrimeiraCor(a);
    const corB = extrairPrimeiraCor(b);
    if (!corA && !corB) return 0;
    if (!corA) return 1;
    if (!corB) return -1;
    return corA.localeCompare(corB, 'pt-BR');
  });
}
```

### Arquivo editado
1. `src/hooks/usePedidosEtapas.ts`
