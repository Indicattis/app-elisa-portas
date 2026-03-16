

## Plano: Editar função e transferir colaboradores entre funções na página de Vagas

### Resumo
Adicionar interatividade nos cards de colaboradores para permitir alterar a função (role) de cada um diretamente na página `/administrativo/rh-dp/vagas`, usando um select/popover inline.

### Mudanças

**`src/pages/administrativo/VagasPage.tsx`**

1. **Card do colaborador com ação de transferência** — Adicionar um botão (ícone de edição ou o card inteiro clicável) que abre um `Dialog` ou `Popover` com:
   - Nome do colaborador (read-only, para contexto)
   - Select com todas as funções ativas (da query `system-roles-active` já existente) para escolher a nova função
   - Botão confirmar

2. **Função `handleTransferUser`** — Ao confirmar:
   - `supabase.from("admin_users").update({ role: novaRole }).eq("id", userId)`
   - Invalidar query `all-users` para refletir a mudança
   - Toast de sucesso/erro

3. **UX** — Cada card de colaborador ganha um pequeno ícone de edição (lápis ou setas) no canto. Ao clicar, abre o dialog de transferência com a função atual pré-selecionada. O select mostra todas as funções agrupadas por setor para facilitar a escolha.

Nenhuma migração SQL necessária — o campo `role` já existe em `admin_users` e é do tipo `text`.

