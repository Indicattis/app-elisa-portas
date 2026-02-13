
# Corrigir ordens duplicadas em /logistica/expedicao

## Problema

A tabela `ordens_carregamento` contém 32 registros com `tipo_entrega = 'instalacao'` que são legados/órfãos. Esses mesmos pedidos também existem na tabela `instalacoes`. Quando ambos aparecem no calendário ou na lista, geram duplicatas.

O hook `useOrdensCarregamentoUnificadas` (lista de disponíveis) já filtra corretamente por `tipo_entrega === 'entrega'`, mas o hook `useOrdensCarregamentoCalendario` (calendário) não faz essa filtragem — busca TODOS os registros de `ordens_carregamento` sem distinção.

## Solução

Aplicar a mesma lógica de filtragem no hook do calendário: excluir registros de `ordens_carregamento` cujo `tipo_entrega` da venda vinculada seja `'instalacao'` ou `'manutencao'`, pois esses já vêm da tabela `instalacoes`.

## Detalhes técnicos

### Arquivo: `src/hooks/useOrdensCarregamentoCalendario.ts`

**1. Incluir `tipo_entrega` no select de `ordens_carregamento`** (já vem via `venda:vendas(...)`, que inclui `tipo_entrega` indiretamente, mas precisamos garantir o acesso).

**2. Filtrar ordens_carregamento em JS** antes de combinar, similar ao que `useOrdensCarregamentoUnificadas` faz:

```typescript
// Filtrar apenas entregas (instalações vêm da tabela instalacoes)
const ordensEntrega = (ordensCarregamento || []).filter(
  (ordem: any) => {
    const tipoEntrega = ordem.venda?.tipo_entrega;
    return tipoEntrega === 'entrega' || !tipoEntrega;
  }
);
```

Na linha 208-212, substituir:
```typescript
const ordensComFonte = (ordensCarregamento || []).map(...)
```
por:
```typescript
const ordensEntrega = (ordensCarregamento || []).filter(
  (ordem: any) => {
    const tipoEntrega = ordem.venda?.tipo_entrega;
    return tipoEntrega === 'entrega' || !tipoEntrega;
  }
);
const ordensComFonte = ordensEntrega.map(...)
```

Isso garante que registros de instalação/manutenção na `ordens_carregamento` sejam ignorados, eliminando duplicatas com a tabela `instalacoes`.

### Arquivo editado
1. `src/hooks/useOrdensCarregamentoCalendario.ts`
