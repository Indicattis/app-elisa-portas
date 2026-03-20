

## Plano: Sistema de Missões no Checklist Liderança

### O que será feito
Um novo sistema de "Missões" na página `/direcao/checklist-lideranca`. Cada missão é um conjunto de checkboxes com título e prazo. As missões aparecem em uma seção abaixo da Programação Semanal em grid de 5 colunas.

### 1. Banco de dados — 2 novas tabelas

**`missoes`** — armazena cada missão
- `id` (uuid, PK)
- `titulo` (text, NOT NULL)
- `prazo` (date, NOT NULL)
- `created_by` (uuid, ref auth.users)
- `created_at`, `updated_at` (timestamps)

**`missao_checkboxes`** — itens de cada missão
- `id` (uuid, PK)
- `missao_id` (uuid, FK → missoes, ON DELETE CASCADE)
- `descricao` (text, NOT NULL)
- `concluida` (boolean, default false)
- `ordem` (integer, default 0)
- `created_at` (timestamp)

RLS: leitura para authenticated, inserção/deleção para o criador ou admin/diretor.

### 2. Hook `useMissoes.ts`
- Query: buscar missões com seus checkboxes (`missoes` + `missao_checkboxes`)
- Mutations: `criarMissao` (insere missão + checkboxes), `deletarMissao`, `toggleCheckbox`

### 3. Modal `NovaMissaoModal.tsx`
- Campos: título, prazo (date picker)
- Lista dinâmica de checkboxes: input + botão adicionar, sem limite
- Botão remover em cada item
- Estilo glassmorphism consistente

### 4. Seção na página `ChecklistLideranca.tsx`
- Nova seção "Missões" abaixo da Programação Semanal
- Grid de 5 colunas com cards mostrando: título, prazo, progresso, primeiros 5 checkboxes (não marcáveis, apenas visuais)
- Botão "Adicionar Missão" no header da página (junto aos outros botões)
- Ao clicar no card, poder ver detalhes / marcar checkboxes (futura expansão)

### Arquivos impactados
- **Novo**: migration SQL (2 tabelas + RLS)
- **Novo**: `src/hooks/useMissoes.ts`
- **Novo**: `src/components/todo/NovaMissaoModal.tsx`
- **Editar**: `src/pages/ChecklistLideranca.tsx` — botão no header + seção de missões

