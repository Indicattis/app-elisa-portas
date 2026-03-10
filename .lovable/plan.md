

## Plan: Add "Create Role" and "Edit Role" to Organograma RH

### Changes to `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

**1. Import existing modals**
- Import `CreateRoleModal` and `EditRoleModal` from `@/components/admin/`
- Import `Pencil` icon from lucide-react
- Add `SystemRole` interface (matching EditRoleModal's expected shape)

**2. Add state**
- `createRoleModalOpen: boolean` for the create modal
- `editingRole: SystemRole | null` for the edit modal

**3. Expand `system-roles-active` query**
- Fetch full role objects (`id, key, label, setor, descricao, ativo, ordem`) instead of just `key, label`, so we can pass the role object to `EditRoleModal`

**4. Add "Nova Função" button**
- Place a button in the header area (next to the sector title or at the top of the content area) that opens `CreateRoleModal`

**5. Add "Edit" button per role header**
- Next to each role label (beside the delete button area), add a `Pencil` icon button
- On click, find the full `SystemRole` object from the query data matching `group.role` and set `editingRole`

**6. Render modals**
- Add `<CreateRoleModal>` and `<EditRoleModal>` at the bottom of the component, both invalidating `system-roles-active` and `all-users` queries on success

### Files changed
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

