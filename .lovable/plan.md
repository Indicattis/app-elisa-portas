
# Plano: Corrigir Exibição de Ordens e Sincronizar Ordenação

## Problemas Identificados

### 1. Ordens de Pintura não aparecem
A tabela `ordens_pintura` não possui a coluna `pausada`, mas o hook `useOrdensProducaoPrioridade.ts` tenta selecionar essa coluna, causando erro silencioso na query.

### 2. Ordens de Qualidade vazias
Não há ordens de qualidade ativas no banco (historico = false). Isso é comportamento correto - simplesmente não existem ordens de qualidade pendentes.

### 3. Ordenação do Cronograma não afeta páginas de produção
O hook `useOrdemProducao.ts` ordena por `prioridade_etapa` do pedido (linhas 223-229), não pelo campo `prioridade` da ordem individual. O cronograma atualiza `prioridade` nas ordens, mas as páginas de produção ignoram esse campo.

## Alterações Necessárias

### Arquivo 1: `src/hooks/useOrdensProducaoPrioridade.ts`

Remover `pausada` da query de `ordens_pintura`:

```typescript
// Linha 78-85 - Query atual
} else if (tabela === 'ordens_pintura') {
  const result = await supabase
    .from('ordens_pintura')
    .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pausada, ...')
    // pausada não existe nesta tabela!
}

// Correção - remover pausada
} else if (tabela === 'ordens_pintura') {
  const result = await supabase
    .from('ordens_pintura')
    .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pedido:pedidos_producao(numero_pedido, cliente_nome)')
    .eq('historico', false)
    .order('prioridade', { ascending: false })
    .order('created_at', { ascending: true });
  data = result.data;
  error = result.error;
}
```

### Arquivo 2: `src/hooks/useOrdemProducao.ts`

Alterar ordenação para usar `prioridade` da ordem (linhas 222-229):

```typescript
// Código atual - usa prioridade_etapa do pedido
ordensProcessadas.sort((a: any, b: any) => {
  const aPrio = a._prioridadeEtapa || 0;
  const bPrio = b._prioridadeEtapa || 0;
  if (bPrio !== aPrio) return bPrio - aPrio;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
});

// Código corrigido - usa prioridade da ordem individual
ordensProcessadas.sort((a: any, b: any) => {
  const aPrio = a.prioridade || 0;
  const bPrio = b.prioridade || 0;
  if (bPrio !== aPrio) return bPrio - aPrio;
  // Desempate por created_at (mais antiga primeiro)
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
});
```

## Resultado Esperado

| Item | Antes | Depois |
|------|-------|--------|
| Ordens de Pintura no cronograma | Erro, não aparecem | Exibidas corretamente |
| Ordens de Qualidade | Vazio (correto) | Vazio (sem ordens ativas) |
| Ordenação nas páginas de produção | Ignora cronograma | Respeita ordem definida no cronograma |

## Fluxo de Ordenação Corrigido

1. Gestor acessa `/fabrica/cronograma-producao`
2. Arrasta ordens para definir prioridade
3. Sistema atualiza campo `prioridade` em cada ordem
4. Operador acessa `/producao/perfiladeira` (ou outra)
5. Ordens aparecem na ordem definida pelo gestor
