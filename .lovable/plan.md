

## Plano: Adicionar página "Gastos" ao hub financeiro

### Conceito
Nova página `/administrativo/financeiro/gastos` para cadastrar gastos individuais vinculados aos tipos de custos existentes. Cada gasto puxa a descrição do tipo de custo (editável), tem valor, data e um responsável pelo pagamento (selecionado da lista de colaboradores).

### Alterações

**1. Migração SQL — criar tabela `gastos`**
```sql
CREATE TABLE public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_custo_id UUID NOT NULL REFERENCES public.tipos_custos(id),
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage gastos"
  ON public.gastos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

**2. `src/hooks/useGastos.ts`** (novo)
- Hook CRUD para a tabela `gastos`
- Select com join para trazer `tipos_custos.nome` e dados do responsável
- Filtro por mês/período

**3. `src/pages/administrativo/GastosPage.tsx`** (novo)
- Tema dark glassmorphism consistente com as demais páginas
- Tabela listando gastos com colunas: Tipo de Custo, Descrição, Valor, Data, Responsável, Status
- Dialog de criação/edição:
  - Select de tipo de custo (puxa de `useTiposCustos`)
  - Ao selecionar, preenche descrição automaticamente (editável)
  - Input de valor
  - Date picker para data
  - Select de responsável (puxa de `useAllUsers` ou query similar em `admin_users`)
  - Textarea de observações
- Filtros por mês e tipo de custo

**4. `src/pages/administrativo/FinanceiroHub.tsx`**
- Adicionar item "Gastos" ao array `menuItems` com ícone `DollarSign` e path `/administrativo/financeiro/gastos`

**5. `src/App.tsx`**
- Adicionar rota `/administrativo/financeiro/gastos` → `GastosPage`

### Arquivos alterados
- Nova migração SQL (1 arquivo)
- `src/hooks/useGastos.ts` (novo)
- `src/pages/administrativo/GastosPage.tsx` (novo)
- `src/pages/administrativo/FinanceiroHub.tsx` (adicionar menu item)
- `src/App.tsx` (adicionar rota)

