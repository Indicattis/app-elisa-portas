

## Plano: Aprovações Autorizados em /direcao/aprovacoes

### O que será feito

1. **Migração DB**: Adicionar coluna `aprovado_direcao` (boolean, default false) e `aprovado_direcao_por` (uuid) e `aprovado_direcao_em` (timestamptz) na tabela `acordos_instalacao_autorizados`
2. **Nova página**: Criar `src/pages/direcao/aprovacoes/AprovacoesAutorizados.tsx` — reutiliza a mesma tabela de acordos do `AcordosAutorizados.tsx` mas sem criar/editar/excluir, e com botão de aprovar por linha
3. **Hub**: Adicionar botão "Aprovações Autorizados" com ícone `Users` no `DirecaoAprovacoesHub.tsx` com contador de acordos pendentes de aprovação (`aprovado_direcao = false`)
4. **Rota**: Registrar `/direcao/aprovacoes/autorizados` no `App.tsx`

### Implementação

**1. Migração SQL**
```sql
ALTER TABLE public.acordos_instalacao_autorizados
  ADD COLUMN aprovado_direcao boolean NOT NULL DEFAULT false,
  ADD COLUMN aprovado_direcao_por uuid REFERENCES auth.users(id),
  ADD COLUMN aprovado_direcao_em timestamptz;
```

**2. `src/pages/direcao/aprovacoes/AprovacoesAutorizados.tsx`**
- Usa `MinimalistLayout` com breadcrumb `Home > Direção > Aprovações > Autorizados`
- Busca acordos com `aprovado_direcao = false` (pendentes) — com toggle para ver todos
- Mesma tabela do `AcordosAutorizados` (cliente, autorizado, portas, valor, excesso, status, data, criador)
- Coluna extra "Aprovação" com botão verde "Aprovar" que seta `aprovado_direcao = true`, `aprovado_direcao_por = user.id`, `aprovado_direcao_em = now()`
- Badge visual para acordos já aprovados

**3. `DirecaoAprovacoesHub.tsx`**
- Adicionar item: `{ label: 'Aprovações Autorizados', icon: Users, path: '/direcao/aprovacoes/autorizados' }`
- Contador: acordos com `aprovado_direcao = false`

**4. `App.tsx`**
- Nova rota `/direcao/aprovacoes/autorizados` → `AprovacoesAutorizados`

### Detalhes técnicos

- A nova página é read-only do ponto de vista de CRUD (sem criar/editar/excluir acordos)
- Apenas a ação de aprovar é permitida, atualizando os 3 campos de aprovação
- O hook `useAcordosAutorizados` será reutilizado para buscar dados; a aprovação será uma chamada direta ao Supabase na página

