

## Plano: Desabilitar "Contas a Pagar" e adicionar botão "Bancos"

### Alterações

**1. `src/pages/administrativo/FinanceiroHub.tsx`**
- Mudar `ativo: false` no item "Contas a Pagar" (linha 14)
- Adicionar novo item `{ label: "Bancos", icon: Landmark, path: "/administrativo/financeiro/bancos", ativo: true }` ao array `menuItems`
- Importar ícone `Landmark` do lucide-react

**2. Migração SQL — criar tabela `bancos`**
```sql
CREATE TABLE public.bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT DEFAULT 'corrente',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage bancos"
  ON public.bancos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

**3. `src/hooks/useBancos.ts`** (novo)
- Hook CRUD para tabela `bancos` (listar, criar, editar, excluir)

**4. `src/pages/administrativo/BancosPage.tsx`** (novo)
- Tema dark glassmorphism consistente
- Tabela com colunas: Nome, Código, Agência, Conta, Tipo, Status
- Dialog de criação/edição com campos: nome, código do banco, agência, conta, tipo (corrente/poupança), observações
- Toggle de ativo/inativo
- Breadcrumb e botão voltar

**5. `src/App.tsx`**
- Adicionar rota `/administrativo/financeiro/bancos` → `BancosPage`

### Arquivos alterados
- Nova migração SQL
- `src/hooks/useBancos.ts` (novo)
- `src/pages/administrativo/BancosPage.tsx` (novo)
- `src/pages/administrativo/FinanceiroHub.tsx` (editar)
- `src/App.tsx` (adicionar rota)

