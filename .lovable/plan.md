
# Plano: Exibir Informações Adicionais nas Ordens do Cronograma

## Objetivo

Exibir nas ordens listadas em `/fabrica/cronograma-producao`:
1. Metragem linear (se houver)
2. Metragem quadrada (se houver)
3. Cores das portas
4. Motivo da pausa (se estiver pausada)

## Análise das Tabelas

| Tabela | metragem_linear | metragem_quadrada | pausada | justificativa_pausa |
|--------|-----------------|-------------------|---------|---------------------|
| ordens_perfiladeira | Sim | - | Sim | Sim |
| ordens_soldagem | - | Sim | Sim | Sim |
| ordens_separacao | - | - | Sim | Sim |
| ordens_qualidade | - | - | Sim | Sim |
| ordens_pintura | - | Sim | - | - |

As cores das portas vêm da tabela `venda_produtos` relacionada ao pedido via `pedidos_producao.venda_id`.

## Alterações

### 1. Hook `useOrdensProducaoPrioridade.ts`

**Interface `OrdemProducaoSimples`** - Adicionar campos:
```typescript
export interface OrdemProducaoSimples {
  // ... campos existentes ...
  metragem_linear?: number;
  metragem_quadrada?: number;
  justificativa_pausa?: string;
  cores?: { nome: string; codigo_hex: string }[];
}
```

**Queries por tabela** - Adicionar campos específicos:

- **Perfiladeira**: adicionar `metragem_linear, justificativa_pausa`
- **Soldagem**: adicionar `metragem_quadrada, justificativa_pausa`
- **Separação**: adicionar `justificativa_pausa`
- **Qualidade**: adicionar `justificativa_pausa`
- **Pintura**: adicionar `metragem_quadrada` (não tem campo de pausa)

**Buscar cores** - Nova query para obter cores via pedido:
```typescript
// Após obter ordens, buscar venda_id dos pedidos
const pedidoIds = data.map(o => o.pedido_id);
const { data: pedidos } = await supabase
  .from('pedidos_producao')
  .select('id, venda_id')
  .in('id', pedidoIds);

// Buscar produtos com cores
const vendaIds = pedidos.map(p => p.venda_id).filter(Boolean);
const { data: produtos } = await supabase
  .from('venda_produtos')
  .select('venda_id, cor:cor_id(nome, codigo_hex)')
  .in('venda_id', vendaIds);

// Mapear cores por pedido_id
```

### 2. Componente `OrdemProducaoCard.tsx`

**Layout atualizado**:

```
┌─────────────────────────────────────────┐
│ ⋮⋮  ① SOLD-12345            ⏸ Pausada  │
│     Cliente Nome • PED-001              │
│     ┌──┐┌──┐ cores     12.5m² / 45.2m   │
│     └──┘└──┘                            │
│     ⚠️ Motivo da pausa aqui...          │
│     [Disponível]        [Avatar] Nome   │
└─────────────────────────────────────────┘
```

**Exibição condicional**:
- Metragem linear: apenas se valor > 0 (perfiladeira)
- Metragem quadrada: apenas se valor > 0 (soldagem/pintura)
- Cores: círculos coloridos (max 4, "+N" se mais)
- Motivo pausa: apenas se `pausada === true` e `justificativa_pausa` existir

### 3. Implementação Visual

**Cores das portas**:
```tsx
{ordem.cores && ordem.cores.length > 0 && (
  <div className="flex items-center gap-1">
    {ordem.cores.slice(0, 4).map((cor, i) => (
      <div 
        key={i}
        className="w-4 h-4 rounded-full border border-white/20"
        style={{ backgroundColor: cor.codigo_hex }}
        title={cor.nome}
      />
    ))}
    {ordem.cores.length > 4 && (
      <span className="text-[10px] text-zinc-400">+{ordem.cores.length - 4}</span>
    )}
  </div>
)}
```

**Metragens**:
```tsx
<div className="flex items-center gap-2 text-[10px] text-zinc-400">
  {ordem.metragem_quadrada && ordem.metragem_quadrada > 0 && (
    <span>{ordem.metragem_quadrada.toFixed(1)}m²</span>
  )}
  {ordem.metragem_linear && ordem.metragem_linear > 0 && (
    <span>{ordem.metragem_linear.toFixed(1)}m</span>
  )}
</div>
```

**Motivo da pausa**:
```tsx
{ordem.pausada && ordem.justificativa_pausa && (
  <div className="mt-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
    <p className="text-[10px] text-amber-300 line-clamp-2">
      {ordem.justificativa_pausa}
    </p>
  </div>
)}
```

## Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/hooks/useOrdensProducaoPrioridade.ts` | Expandir interface e queries |
| `src/components/cronograma/OrdemProducaoCard.tsx` | Adicionar exibição das novas informações |

## Resultado Esperado

Cards do cronograma exibirão:
- Metragem linear para ordens de perfiladeira
- Metragem quadrada para ordens de soldagem e pintura
- Indicadores visuais de cores das portas do pedido
- Justificativa de pausa destacada em fundo âmbar quando a ordem estiver pausada
