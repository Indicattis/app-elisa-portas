
# Plano: Upload de Foto no Modal de Detalhes do Usuário

## Situação Atual

- O componente `AvatarUpload` existe e funciona corretamente
- Na lista de usuários, está em modo `compact` (apenas exibe o avatar)
- O modal `UserDetailsModal` mostra apenas o avatar estático, sem opção de edição

## Solução Proposta

Adicionar o componente `AvatarUpload` completo no modal de detalhes do usuário, permitindo:
- Ver foto atual
- Fazer upload de nova foto
- Remover foto existente

## Alteração Técnica

### Arquivo: `src/components/admin/UserDetailsModal.tsx`

**1. Adicionar import do AvatarUpload:**
```typescript
import { AvatarUpload } from "@/components/AvatarUpload";
```

**2. Adicionar callback para atualização:**
```typescript
interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  roleLabel: string;
  onAvatarUpdate?: (userId: string, newAvatarUrl: string | null) => void; // NOVO
}
```

**3. Substituir Avatar estático pelo AvatarUpload:**

De:
```tsx
<Avatar className="w-16 h-16">
  <AvatarImage src={user.foto_perfil_url || undefined} alt={user.nome} />
  <AvatarFallback>...</AvatarFallback>
</Avatar>
```

Para:
```tsx
<AvatarUpload
  userId={user.user_id}
  currentAvatarUrl={user.foto_perfil_url}
  userName={user.nome}
  onAvatarUpdate={(url) => onAvatarUpdate?.(user.user_id, url)}
/>
```

### Arquivo: `src/pages/admin/AdminUsersMinimalista.tsx`

**Passar o callback para o modal:**
```tsx
<UserDetailsModal
  open={!!selectedUser}
  onOpenChange={(open) => !open && setSelectedUser(null)}
  user={selectedUser}
  roleLabel={selectedUser ? (roleLabelsMap[selectedUser.role] || selectedUser.role) : ""}
  onAvatarUpdate={handleAvatarUpdate} // NOVO
/>
```

## Resultado Visual

No modal de detalhes do usuário:
```
┌─────────────────────────────────────────┐
│  Detalhes do Usuário                    │
├─────────────────────────────────────────┤
│  ┌──────┐                               │
│  │      │  [Alterar Foto] [Remover]     │
│  │ FOTO │  JPG, PNG ou GIF. Máx. 5MB.   │
│  │      │                               │
│  └──────┘  Nome do Usuário              │
│            email@exemplo.com             │
│            [Ativo] [Colaborador]        │
├─────────────────────────────────────────┤
│  Função: Administrador                  │
│  Setor: Administrativo                  │
│  ...                                    │
└─────────────────────────────────────────┘
```

## Benefícios

- Reutiliza componente existente (`AvatarUpload`)
- Upload direto para Supabase Storage
- Atualiza lista de usuários automaticamente
- Feedback visual com toast de sucesso/erro
