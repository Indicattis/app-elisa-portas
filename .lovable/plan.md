

## Adicionar ordenação por data de cadastro/pagamento em Gastos

### Objetivo
Permitir ao usuário alternar entre ordenação por **data de cadastro** (padrão) e **data de pagamento** na tela de gastos.

### Implementação

**1. Hook `useGastos.ts`**
- Adicionar parâmetro `ordenarPor: 'cadastro' | 'pagamento'` (default: 'cadastro')
- Modificar a query do Supabase para usar `.order()` dinâmico:
  - `'cadastro'`: `.order("created_at", { ascending: false })`
  - `'pagamento'`: `.order("data", { ascending: false })`

**2. Página `GastosPage.tsx`**
- Adicionar estado local `ordenarPor` com valor inicial `'cadastro'`
- Adicionar seletor `<Select>` ao lado dos filtros existentes com opções:
  - "Data de Cadastro" (value: 'cadastro')
  - "Data de Pagamento" (value: 'pagamento')
- Passar `ordenarPor` para o hook `useGastos`

**3. UI/UX**
- O seletor terá largura de ~180px, estilo consistente com os outros filtros (bg-white/5, border-white/20)
- Ícone de ordenação (ArrowUpDown ou similar) para indicar funcionalidade de ordenação

### Fora do escopo
- Não adicionar ordenação ascendente/descendente (sempre decrescente, mais recente primeiro)
- Não persistir a preferência de ordenação (sessionStorage/localStorage)

