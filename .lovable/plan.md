
# Plano: Adicionar Observacoes do Pedido em Todas as Downbars

## Contexto

O usuario quer que as observacoes do pedido (com a data de atualizacao) aparecam em todas as downbars do sistema.

## Analise do Estado Atual

### Downbars Identificadas

1. **OrdemDetalhesSheet** (producao) - JA mostra observacoes do pedido, mas SEM a data
2. **CarregamentoDownbar** - NAO mostra observacoes do pedido
3. **OrdemCarregamentoDetails** - Mostra apenas observacoes da ordem (nao do pedido)

### Dados Necessarios

O campo `observacoes` esta em `pedidos_producao.observacoes` e a data de atualizacao em `pedidos_producao.updated_at`.

---

## Alteracoes Necessarias

### 1. Hooks - Adicionar `updated_at` na Query

#### Arquivo: `src/hooks/useOrdemProducao.ts`

Adicionar `updated_at` ao select do pedido:

```typescript
pedido:pedidos_producao!pedido_id(
  id,
  numero_pedido,
  cliente_nome,
  venda_id,
  prioridade_etapa,
  em_backlog,
  observacoes,
  updated_at,  // ADICIONAR
  vendas(...)
)
```

#### Arquivo: `src/hooks/useOrdemPintura.ts`

Adicionar `observacoes` e `updated_at` ao select do pedido:

```typescript
.select(`
  id, 
  numero_pedido, 
  cliente_nome,
  venda_id,
  prioridade_etapa,
  em_backlog,
  observacoes,    // ADICIONAR
  updated_at,     // ADICIONAR
  vendas(...)
`)
```

#### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Adicionar `observacoes` e `updated_at` ao select do pedido:

```typescript
pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
  id,
  numero_pedido,
  etapa_atual,
  observacoes,    // ADICIONAR
  updated_at      // ADICIONAR
)
```

---

### 2. Componentes - Exibir Observacoes com Data

#### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**Linhas 653-666** - Adicionar data ao bloco existente:

```tsx
{ordem.pedido?.observacoes && (
  <>
    <Separator />
    <div className="space-y-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Package className="h-4 w-4" />
          Observacoes Gerais do Pedido
        </span>
        {ordem.pedido?.updated_at && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {ordem.pedido.observacoes}
      </p>
    </div>
  </>
)}
```

#### Arquivo: `src/components/carregamento/CarregamentoDownbar.tsx`

**Apos linha 259** (depois do progresso, antes do Separator) - Adicionar novo bloco:

```tsx
{/* Observacoes do Pedido */}
{ordem.pedido?.observacoes && (
  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
        Observacoes do Pedido
      </span>
      {ordem.pedido?.updated_at && (
        <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
          {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
        </span>
      )}
    </div>
    <p className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-line">
      {ordem.pedido.observacoes}
    </p>
  </div>
)}
```

#### Arquivo: `src/components/expedicao/OrdemCarregamentoDetails.tsx`

**Apos linha 246** (depois do card Pedido) - Adicionar novo bloco:

```tsx
{/* Card: Observacoes do Pedido */}
{ordem.pedido?.observacoes && (
  <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        Observacoes do Pedido
      </h3>
      {ordem.pedido?.updated_at && (
        <span className="text-[10px] text-amber-400/70">
          {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
        </span>
      )}
    </div>
    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
      {ordem.pedido.observacoes}
    </p>
  </div>
)}
```

---

### 3. Atualizacao de Interfaces TypeScript

#### Arquivo: `src/hooks/useOrdemProducao.ts`

Atualizar interface do pedido:

```typescript
pedido?: {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  venda_id?: string;
  observacoes?: string;    // JA EXISTE
  updated_at?: string;     // ADICIONAR
  vendas?: {...};
};
```

#### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

Atualizar interface Ordem:

```typescript
pedido?: {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  venda_id?: string;
  observacoes?: string;
  updated_at?: string;     // ADICIONAR
  vendas?: {...};
  produtos?: Array<{...}>;
};
```

#### Arquivo: `src/types/ordemCarregamento.ts`

Atualizar interface do pedido:

```typescript
pedido?: {
  id: string;
  numero_pedido: string;
  etapa_atual?: string;
  data_producao?: string | null;
  observacoes?: string;    // ADICIONAR
  updated_at?: string;     // ADICIONAR
  instalacao?: Array<{...}> | null;
};
```

#### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Atualizar interface OrdemCarregamentoUnificada:

```typescript
pedido?: {
  id: string;
  numero_pedido: string;
  etapa_atual?: string;
  observacoes?: string;    // ADICIONAR
  updated_at?: string;     // ADICIONAR
} | null;
```

---

## Resumo das Alteracoes

| Arquivo | Tipo | Acao |
|---------|------|------|
| `src/hooks/useOrdemProducao.ts` | Hook | Adicionar `updated_at` ao select + interface |
| `src/hooks/useOrdemPintura.ts` | Hook | Adicionar `observacoes` e `updated_at` ao select |
| `src/hooks/useOrdensCarregamentoUnificadas.ts` | Hook + Interface | Adicionar campos ao select e interface |
| `src/types/ordemCarregamento.ts` | Tipo | Adicionar campos na interface |
| `src/components/production/OrdemDetalhesSheet.tsx` | Componente | Adicionar data ao bloco existente + interface |
| `src/components/carregamento/CarregamentoDownbar.tsx` | Componente | Adicionar bloco de observacoes |
| `src/components/expedicao/OrdemCarregamentoDetails.tsx` | Componente | Adicionar bloco de observacoes |

## Resultado Esperado

- Todas as downbars mostrarao as observacoes do pedido quando existirem
- Cada observacao tera a data/hora de atualizacao exibida no canto direito
- O estilo sera consistente em todas as downbars (fundo amarelo/amber sutil)
