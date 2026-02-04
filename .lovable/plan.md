
# Plano: Corrigir Cores e Adicionar Tipo de Entrega no Cronograma

## Problema Identificado

1. **Cores nao aparecem**: O codigo usa `venda_produtos` mas a tabela correta e `produtos_vendas`
2. **Falta tipo de entrega**: Nao ha busca nem exibicao do tipo de entrega (instalacao/entrega/manutencao)

## Analise dos Dados

| Tabela | Campo | Valores |
|--------|-------|---------|
| `produtos_vendas` | `tipo_produto` | porta_enrolar, pintura_epoxi, porta_social, acessorio, adicional |
| `produtos_vendas` | `cor_id` | UUID ligado a `catalogo_cores` |
| `vendas` | `tipo_entrega` | entrega, instalacao, manutencao, servico, correcao |

## Alteracoes Necessarias

### 1. Hook `useOrdensProducaoPrioridade.ts`

**Corrigir nome da tabela e filtrar por tipo de produto:**

```typescript
// ANTES (errado):
const produtosResult = await (supabase as any)
  .from('venda_produtos')  // Tabela errada
  .select('venda_id, cor_id')
  .in('venda_id', vendaIds);

// DEPOIS (correto):
const produtosResult = await supabase
  .from('produtos_vendas')  // Tabela correta
  .select('venda_id, cor_id')
  .in('venda_id', vendaIds)
  .in('tipo_produto', ['porta_enrolar', 'pintura_epoxi', 'porta_social'])
  .not('cor_id', 'is', null);
```

**Adicionar tipo_entrega na query do pedido:**

Atualizar as queries de cada tabela para incluir o `tipo_entrega` da venda:

```typescript
// Exemplo para perfiladeira:
.select(`
  id, numero_ordem, pedido_id, status, prioridade, responsavel_id, 
  pausada, metragem_linear, justificativa_pausa, 
  pedido:pedidos_producao(
    numero_pedido, cliente_nome, venda_id,
    venda:vendas(tipo_entrega)
  )
`)
```

**Atualizar interface:**

```typescript
export interface OrdemProducaoSimples {
  // ... campos existentes ...
  tipo_entrega?: 'entrega' | 'instalacao' | 'manutencao' | 'servico' | 'correcao';
}
```

**Mapear tipo_entrega no retorno:**

```typescript
return (data || []).map((ordem: any) => ({
  // ... campos existentes ...
  tipo_entrega: ordem.pedido?.venda?.tipo_entrega,
}));
```

### 2. Componente `OrdemProducaoCard.tsx`

**Adicionar badge de tipo de entrega:**

```typescript
const getTipoEntregaConfig = (tipo?: string) => {
  switch (tipo) {
    case 'instalacao':
      return { label: 'Instalacao', icon: Wrench, className: 'bg-purple-500/20 text-purple-300' };
    case 'entrega':
      return { label: 'Entrega', icon: Truck, className: 'bg-cyan-500/20 text-cyan-300' };
    case 'manutencao':
      return { label: 'Manutencao', icon: Settings, className: 'bg-orange-500/20 text-orange-300' };
    default:
      return null;
  }
};
```

**Layout atualizado do card:**

```
+-------------------------------------------+
| (grip) 1 ORD-12345              [Pausada] |
|        Cliente Nome . PED-001             |
|        [Instalacao]                       |  <-- NOVO: tipo entrega
|        (o)(o)(o) cores       12.5m² 45m   |
|        [!] Motivo da pausa...             |
|        [Disponivel]         [Avatar] Nome |
+-------------------------------------------+
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useOrdensProducaoPrioridade.ts` | Corrigir tabela, filtrar tipo_produto, adicionar tipo_entrega |
| `src/components/cronograma/OrdemProducaoCard.tsx` | Exibir badge de tipo de entrega |

## Resultado Esperado

- Cores das portas de enrolar aparecerao corretamente
- Badge indicando se e Entrega, Instalacao ou Manutencao
- Icones visuais para diferenciar rapidamente os tipos
