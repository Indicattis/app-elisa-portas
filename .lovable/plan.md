

## Plano: Transformar /logistica/frete em hub com 3 subpáginas

### Estrutura

```text
/logistica/frete          → FreteHub (3 botões, mesmo estilo do LogisticaHub)
/logistica/frete/internos → FreteMinimalista atual (renomeado)
/logistica/frete/valores  → Nova página: valores por transportadora (P, G, GG por estado)
/logistica/frete/transportadoras → Nova página: CRUD de transportadoras
```

### Alterações

**1. Criar `src/pages/logistica/FreteHub.tsx`** — hub com 3 botões no mesmo estilo do `LogisticaHub` (glassmorphism, partículas, grid desktop / lista mobile):
- "Valores Internos" (ícone Package) → `/logistica/frete/internos`
- "Valores Transportadoras" (ícone Truck) → `/logistica/frete/valores`
- "Transportadoras" (ícone Building2) → `/logistica/frete/transportadoras`
- Breadcrumb: Home > Logística > Frete
- Botão voltar → `/logistica`

**2. Criar tabela `transportadoras`** (migration SQL):
- `id uuid PK`, `nome text NOT NULL`, `cnpj text`, `telefone text`, `ativo boolean default true`, `created_at`, `updated_at`

**3. Criar tabela `frete_transportadoras`** (migration SQL):
- `id uuid PK`, `transportadora_id uuid FK → transportadoras`, `estado char(2)`, `valor_porta_p numeric`, `valor_porta_g numeric`, `valor_porta_gg numeric`, `ativo boolean default true`, `created_at`, `updated_at`
- Unique constraint em `(transportadora_id, estado)`

**4. Criar `src/pages/logistica/FreteTransportadoras.tsx`** — CRUD de transportadoras com MinimalistLayout, tabela com nome/CNPJ/telefone/ativo, dialog para criar/editar

**5. Criar `src/pages/logistica/FreteValoresTransportadoras.tsx`** — tabela de valores por estado para cada transportadora (filtro por transportadora via Select), colunas: Estado, Porta P, Porta G, Porta GG, com dialog para criar/editar

**6. Criar hooks**:
- `src/hooks/useTransportadoras.ts` — CRUD + toggle ativo
- `src/hooks/useFreteTransportadoras.ts` — CRUD valores por estado/transportadora

**7. Atualizar `src/App.tsx`** — adicionar rotas:
- `/logistica/frete` → `FreteHub`
- `/logistica/frete/internos` → `FreteMinimalista`
- `/logistica/frete/valores` → `FreteValoresTransportadoras`
- `/logistica/frete/transportadoras` → `FreteTransportadoras`

**8. Atualizar `FreteMinimalista.tsx`** — ajustar breadcrumb para incluir "Frete" como link (`Home > Logística > Frete > Valores Internos`) e `backPath` para `/logistica/frete`

### Arquivos
- Criar: `FreteHub.tsx`, `FreteTransportadoras.tsx`, `FreteValoresTransportadoras.tsx`, `useTransportadoras.ts`, `useFreteTransportadoras.ts`
- Editar: `App.tsx`, `FreteMinimalista.tsx`
- Migrations: 2 tabelas (`transportadoras`, `frete_transportadoras`)

