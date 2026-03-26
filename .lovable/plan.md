

## Plano: Página de Conversões para Meta Ads

### Objetivo
Criar uma nova página em `/marketing/conversoes-meta` com o mesmo layout da página Google (`/marketing/conversoes`), mas adaptada ao formato de importação do Meta Ads. Colunas: **email** e **phone** (com código de país `+55` prefixado automaticamente).

### Diferenças em relação à página Google
- Sem coluna de data (Meta não usa)
- Header das colunas usa os identificadores do Meta: `email` e `phone`
- Telefone formatado com `+55` no início, sem espaços/parênteses/hífens (ex: `+5511999999999`)
- Subtítulo: "Dados de vendas para importação no Meta Ads"

### Alterações

**1. `src/pages/marketing/ConversoesMeta.tsx`** (novo)
- Mesma estrutura da `Conversoes.tsx`: filtros mês/ano, "Todo o tempo", tabela com cópia por coluna
- Query idêntica: `vendas` com `is_rascunho = false`, telefones únicos
- Colunas: `email` e `phone`
- Formatação do telefone: limpar caracteres especiais e prefixar `+55` se não começar com `+`
- Breadcrumb: Home > Marketing > Conversões Meta

**2. `src/pages/marketing/MarketingHub.tsx`**
- Novo item no menu: `{ label: "Conversões Meta", icon: Copy, path: "/marketing/conversoes-meta", ativo: true }`
- Renomear o item existente "Conversões" para "Conversões Google"

**3. `src/App.tsx`**
- Nova rota lazy: `/marketing/conversoes-meta` → `ConversoesMeta`

### Arquivos alterados
- `src/pages/marketing/ConversoesMeta.tsx` (novo)
- `src/pages/marketing/MarketingHub.tsx`
- `src/App.tsx`

