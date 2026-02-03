

# Plano: Filtrar Ordens por Tipo de Entrega

## Problema

Pedidos com `tipo_entrega='instalacao'` estao exibindo tanto a ordem de Carregamento quanto a de Instalacao, quando deveriam exibir apenas a ordem de Instalacao.

Dados do banco confirmam que alguns pedidos de instalacao possuem registros em ambas as tabelas (`ordens_carregamento` e `instalacoes`), provavelmente por um bug na criacao das ordens.

## Solucao

Filtrar as ordens exibidas no `PedidoOrdemCard` baseado no `tipo_entrega` do pedido.

## Mudancas Necessarias

### Modificar `src/components/fabrica/PedidoOrdemCard.tsx`

**Linhas 61-69 - Aplicar filtro condicional:**

```typescript
// ANTES
const ordens: OrdemStatus[] = [
  pedido.ordens.soldagem,
  pedido.ordens.perfiladeira,
  pedido.ordens.separacao,
  pedido.ordens.qualidade,
  pedido.ordens.pintura,
  pedido.ordens.carregamento,
  pedido.ordens.instalacao,
];

// DEPOIS
const ordensBase: OrdemStatus[] = [
  pedido.ordens.soldagem,
  pedido.ordens.perfiladeira,
  pedido.ordens.separacao,
  pedido.ordens.qualidade,
  pedido.ordens.pintura,
];

// Filtrar baseado no tipo_entrega
// - Instalacao: mostrar apenas ordem de instalacao
// - Entrega: mostrar apenas ordem de carregamento
const ordens: OrdemStatus[] = [
  ...ordensBase,
  ...(pedido.tipo_entrega === 'instalacao' 
    ? [pedido.ordens.instalacao] 
    : pedido.tipo_entrega === 'entrega' 
      ? [pedido.ordens.carregamento]
      : [] // Sem tipo definido, nao mostrar nenhuma
  ),
];
```

## Logica do Filtro

| tipo_entrega | Ordens Exibidas |
|--------------|-----------------|
| `instalacao` | Soldagem, Perfiladeira, Separacao, Qualidade, Pintura, **Instalacao** |
| `entrega` | Soldagem, Perfiladeira, Separacao, Qualidade, Pintura, **Carregamento** |
| `null` | Soldagem, Perfiladeira, Separacao, Qualidade, Pintura |

## Arquivos a Modificar

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/components/fabrica/PedidoOrdemCard.tsx` | 61-69 | Aplicar filtro condicional baseado em tipo_entrega |

## Resultado Esperado

Na etapa "Instalacoes", pedidos com `tipo_entrega='instalacao'` mostrarao apenas a badge de **Instalacao** (nao mais Carregamento).

