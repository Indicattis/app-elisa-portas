
# Plano: Corrigir Agrupamento de Portas na Downbar de Pintura

## Problema Identificado

A ordem PINT-00064 (Edimar) tem:
- **2 portas de enrolar** na venda (`porta_enrolar`)
- **2 serviços de pintura** na venda (`pintura_epoxi`)
- **10 linhas de itens** para pintar, **todas com `produto_venda_id = NULL`**

O header do card usa `CoresPortasEnrolar` que conta corretamente 2 portas baseado nos produtos da venda. Mas a downbar agrupa linhas por `produto_venda_id`, e como todas as linhas tem esse campo nulo, aparecem em um único grupo.

## Solucao Proposta

Modificar a logica de agrupamento na downbar para:
1. Detectar quando nao ha `produto_venda_id` nas linhas
2. Nesse caso, mostrar os itens como "Itens para Todas as Portas" em vez de agrupar por porta inexistente
3. Mostrar um cabecalho indicando quantas portas serao pintadas (baseado nos produtos da venda)

---

## Alteracoes Necessarias

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**Linhas 722-850** - Modificar a logica de agrupamento para pintura:

**Logica atual (problematica):**
```typescript
// Agrupar linhas por produto_venda_id
const linhasPorPorta = linhasQuePrecisaPintura.reduce((grupos, linha) => {
  const key = linha.produto_venda_id || 'sem_porta';
  // ...
}, {});

// Renderiza grupos assumindo que cada grupo = 1 porta
Object.entries(linhasPorPorta).map(([portaId, linhasPorta], index) => {
  // Mostra "Porta 01", "Porta 02", etc.
});
```

**Nova logica:**
```typescript
// Verificar se ha produto_venda_id nas linhas
const temAgrupamentoPorPorta = linhasQuePrecisaPintura.some(l => l.produto_venda_id);

// Contar portas de enrolar do pedido
const portasEnrolar = ordem.pedido?.produtos?.filter(
  (p: any) => p.tipo_produto === 'porta_enrolar'
) || [];

if (!temAgrupamentoPorPorta && portasEnrolar.length > 0) {
  // CASO 1: Linhas nao vinculadas a portas especificas
  // Mostrar cabecalho com info das portas + lista unica de itens
  return (
    <div className="space-y-2 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            Itens para {portasEnrolar.length} Porta{portasEnrolar.length > 1 ? 's' : ''}
          </span>
        </div>
        {/* Mostrar dimensoes de cada porta */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          {portasEnrolar.map((p, i) => (
            <Badge key={i} variant="outline">
              P{i+1}: {formatarDimensoes(p.largura, p.altura)}
            </Badge>
          ))}
        </div>
      </div>
      {/* Lista unica de todos os itens */}
      {linhasQuePrecisaPintura.map((linha) => (
        // ... renderizar item
      ))}
    </div>
  );
} else {
  // CASO 2: Linhas vinculadas a portas especificas (comportamento atual)
  // Manter agrupamento por produto_venda_id
}
```

---

## Resumo das Mudancas

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/components/production/OrdemDetalhesSheet.tsx` | 722-850 | Adicionar verificacao se ha `produto_venda_id` e mostrar layout adequado |

## Resultado Esperado

- Quando linhas tem `produto_venda_id`: Agrupa por porta (comportamento atual)
- Quando linhas NAO tem `produto_venda_id`: Mostra "Itens para X Portas" com dimensoes de cada porta no cabecalho

Esta mudanca resolve a inconsistencia visual entre header (2 portas) e downbar (1 porta) quando os itens nao estao vinculados a portas especificas.

---

## Consideracao Tecnica

O problema de raiz e que a funcao SQL `criar_ordem_pintura` nao esta preenchendo o `produto_venda_id` nas linhas. Uma correcao mais completa seria ajustar essa funcao para vincular os itens as portas. Mas a solucao proposta acima resolve o problema visual imediatamente sem necessidade de migracao de dados.
