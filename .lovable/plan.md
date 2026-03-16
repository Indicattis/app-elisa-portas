

## Plano: Desativar usuários e excluir vagas na página de Vagas

### Mudanças em `src/pages/administrativo/VagasPage.tsx`

1. **Desativar usuários** — Adicionar botão com ícone `UserX` ou `Power` no card do colaborador (ao lado do botão de transferir, visível no hover). Ao clicar:
   - Abrir `AlertDialog` de confirmação ("Deseja desativar {nome}?")
   - Ao confirmar: `supabase.from("admin_users").update({ ativo: false }).eq("id", user.id)`
   - Invalidar query `all-users`
   - Toast de sucesso

2. **Excluir vagas** — Adicionar botão com ícone `Trash2` no card de vaga aberta (canto superior direito, visível no hover). Ao clicar:
   - Abrir `AlertDialog` de confirmação ("Deseja excluir esta vaga?")
   - Ao confirmar: usar `deleteVaga(vaga.id)` do hook `useVagas` já disponível
   - Toast de sucesso (já tratado pelo hook)

3. **Imports adicionais**: `UserX` ou `Power`, `Trash2` de lucide-react; `AlertDialog` components de `@/components/ui/alert-dialog`

4. **Estados**: 
   - `userToDeactivate: User | null` para o alert de desativação
   - `vagaToDelete: Vaga | null` para o alert de exclusão

Nenhuma migração SQL necessária.

