
# Duas alteracoes: foto de perfil em Colaboradores + toggle colaborador em Users

## 1. Foto de perfil no modal de edicao de colaboradores (`/administrativo/rh-dp/colaboradores`)

Adicionar o componente `AvatarUpload` no modal `EditColaboradorModal.tsx`, permitindo alterar a foto de perfil do colaborador diretamente na edicao.

### Arquivo: `src/components/colaboradores/EditColaboradorModal.tsx`

- Importar o componente `AvatarUpload`
- Adicionar o `AvatarUpload` no topo do formulario, acima dos campos existentes
- Usar `colaborador.user_id` e `colaborador.foto_perfil_url` como props
- No callback `onAvatarUpdate`, invalidar a query `colaboradores-minimalista` para atualizar a listagem

## 2. Toggle "Colaborador" na edicao de usuarios (`/admin/users`)

A pagina `AdminUsersMinimalista.tsx` ja salva `eh_colaborador` no `handleSave` (linha 117), e ja carrega o campo no `handleEdit` (linha 100). Porem, nao existe nenhum campo visivel na interface inline para editar esse valor.

### Arquivo: `src/pages/admin/AdminUsersMinimalista.tsx`

- Adicionar, na area de edicao inline (dentro do bloco que aparece quando `editingUser === user.id`), um toggle/switch ou badge clicavel para alterar `eh_colaborador`
- Posicionar ao lado dos badges existentes (status ativo, role, setor)
- Usar um `Switch` ou `Badge` clicavel com visual claro indicando se e colaborador ou nao
- O valor ja e salvo corretamente no `handleSave`, entao basta adicionar o controle visual

## Detalhes tecnicos

### EditColaboradorModal.tsx
```typescript
// Adicionar import
import { AvatarUpload } from "@/components/AvatarUpload";
import { useQueryClient } from "@tanstack/react-query";

// Dentro do form, antes dos campos, adicionar:
<div className="flex justify-center pb-4">
  <AvatarUpload
    userId={colaborador.user_id}
    currentAvatarUrl={colaborador.foto_perfil_url}
    userName={colaborador.nome}
    onAvatarUpdate={() => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores-minimalista"] });
    }}
  />
</div>
```

### AdminUsersMinimalista.tsx
```typescript
// Adicionar import do Switch
import { Switch } from "@/components/ui/switch";

// Na area de edicao inline, adicionar controle para eh_colaborador
// junto aos outros campos editaveis (role, setor)
<div className="flex items-center gap-2">
  <span className="text-xs text-white/60">Colaborador</span>
  <Switch
    checked={editForm.eh_colaborador || false}
    onCheckedChange={(checked) => setEditForm({ ...editForm, eh_colaborador: checked })}
  />
</div>
```

### Arquivos editados
1. `src/components/colaboradores/EditColaboradorModal.tsx` - Adicionar AvatarUpload
2. `src/pages/admin/AdminUsersMinimalista.tsx` - Adicionar switch eh_colaborador na edicao inline
