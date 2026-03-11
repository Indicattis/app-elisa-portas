

## Plano: Filtrar Administrador do organograma + adicionar toggle "visível no organograma"

### O que será feito

1. **Migração de banco**: Adicionar coluna `visivel_organograma` (boolean, default `true`) na tabela `admin_users`.

2. **Filtro no hook `useAllUsers`**: Adicionar `.eq("visivel_organograma", true)` à query, garantindo que apenas usuários marcados como visíveis apareçam no organograma.

3. **Filtro do cargo Administrador no organograma**: No componente `GestaoColaboradoresDirecao.tsx`, filtrar o role `administrador` da lista de roles exibidos por setor (no `getRolesForSetor`).

4. **Toggle no cadastro de usuário (`AddUserDialog`)**: Adicionar um campo Switch "Visível no Organograma" no formulário de criação, enviado junto ao body da edge function `create-user`.

5. **Toggle no modal de detalhes (`UserDetailsModal`)**: Exibir o campo `visivel_organograma` como Switch editável, permitindo ativar/desativar a visibilidade diretamente.

6. **Edge function `create-user`**: Passar o campo `visivel_organograma` ao inserir o registro em `admin_users`.

### Detalhes técnicos

**Migração SQL:**
```sql
ALTER TABLE public.admin_users 
ADD COLUMN visivel_organograma boolean NOT NULL DEFAULT true;
```

**`useAllUsers.ts`** — adicionar filtro:
```typescript
.eq("visivel_organograma", true)
```

**`GestaoColaboradoresDirecao.tsx`** — excluir administrador:
```typescript
const getRolesForSetor = (setor: string) => {
  return (systemRoles || [])
    .filter(r => r.setor === setor && r.key !== 'administrador')
    ...
};
```

**`AddUserDialog.tsx`** — adicionar Switch no form e enviar no body.

**`UserDetailsModal.tsx`** — exibir Switch para `visivel_organograma` com callback de update.

**Edge function `create-user`** — aceitar e persistir `visivel_organograma`.

