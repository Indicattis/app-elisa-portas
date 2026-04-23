

## Aumentar tipografia e adicionar painel lateral mensal em `/paineis/metas-vendas`

Reforçar a hierarquia visual aumentando fontes e destacando os valores principais (total vendido, alvo, comissão), e adicionar uma seção lateral em cada card do vendedor mostrando o **total vendido no mês** (independente do período da meta).

### Mudanças

**1. `src/hooks/useProgressoMetasVendas.ts`**
- Após buscar as vendas do período da meta, buscar também as vendas do **mês corrente** (de `getInicioFimMes(hoje)`) agrupadas por `atendente_id`, para todos os vendedores elegíveis. Para metas globais, somar tudo.
- Adicionar campo `total_vendido_mes: number` em `VendedorProgresso`.
- Quando a meta já é mensal, reusar o mesmo Map (sem segunda query) para evitar custo extra; quando é semanal, fazer uma query adicional do mês.

**2. `src/components/paineis/MetaVendasBarra.tsx`**
- Reorganizar o card em duas colunas: **conteúdo principal** (foto + nome + barra) e **painel lateral direito** com o total vendido no mês.
- Aumentar tamanhos:
  - Nome do vendedor: `text-xl` → `text-2xl font-bold`
  - Total vendido (header): `text-sm` → `text-2xl font-bold tabular-nums`
  - Comissão atual: `text-base` → `text-3xl font-extrabold`
  - Labels uppercase: `text-[10px]` → `text-xs`
  - Altura da barra: `h-7` → `h-10`, valores dentro da barra `text-[10px]` → `text-sm font-semibold`
  - Avatar: `h-28 w-28` → `h-32 w-32`
- Painel lateral (à direita do card, separado por borda vertical sutil `border-l border-white/10 pl-5`):
  - Label: "Vendido no mês" (`text-xs uppercase tracking-wider text-white/50`)
  - Valor: `text-3xl font-extrabold tabular-nums text-white`
  - Sub-label menor com mês corrente (ex.: "abril/2026") usando `Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })`
- Para metas com escopo `global` (linha "Equipe"), o painel lateral mostra o total mensal somado da equipe.

**3. Layout responsivo**
- Card: `flex gap-5` → no desktop usa `flex-row`, em telas menores (`<lg`) o painel lateral cai abaixo (`flex-col lg:flex-row`).
- Largura do painel lateral: `lg:w-56 shrink-0`.

### Layout esquemático

```text
┌──────────────────────────────────────────────────────┬──────────────────┐
│ [FOTO]  Nome do Vendedor                  Comissão   │ VENDIDO NO MÊS   │
│         R$ 12.500 / R$ 30.000             R$ 1.250   │   R$ 48.700      │
│         [████████░░░░░░░░░░░░░░░░░░░░░░]             │   abril/2026     │
└──────────────────────────────────────────────────────┴──────────────────┘
```

### Detalhes técnicos

- O total mensal é calculado a partir de `vendas` com `is_rascunho = false` no intervalo `getInicioFimMes(hoje)`.
- Uma única query mensal por execução do hook (compartilhada entre todas as metas), agrupada client-side por `atendente_id`.
- Para a linha "Equipe" (escopo global), `total_vendido_mes` = soma de todos os elegíveis no mês.
- Sem alterações em tabelas, RLS ou outros painéis.

### Arquivos

- `src/hooks/useProgressoMetasVendas.ts` (editar)
- `src/components/paineis/MetaVendasBarra.tsx` (editar)

### Fora de escopo

- Formulário de cadastro de metas.
- Outros painéis e dashboards.
- Mudanças em schema/RLS.

