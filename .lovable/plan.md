

## Correções: Funções dinâmicas na sidebar + Modal de criação

### Problema 1: Função criada não aparece no setor
O código em `GestaoColaboradoresDirecao.tsx` (e `VagasPage.tsx`) usa o mapeamento **hardcoded** `SETOR_ROLES` do `setorMapping.ts` para determinar quais roles pertencem a cada setor. Funções criadas dinamicamente via `system_roles` (que têm coluna `setor`) são ignoradas porque não estão nesse mapeamento estático.

**Solução**: Alterar a lógica de `rolesForSetor` para combinar os roles do `SETOR_ROLES` com os roles vindos da tabela `system_roles` que tenham o mesmo setor. Ou seja, para um dado setor, os roles válidos serão a união de `SETOR_ROLES[setor]` com `systemRoles.filter(r => r.setor === setor).map(r => r.key)`.

Isso também deve ser invalidado na query `system-roles-active` no `onSuccess` do `CreateRoleModal`.

**Arquivos**: `GestaoColaboradoresDirecao.tsx`, `VagasPage.tsx`

### Problema 2: Setor é opcional no modal mas deveria ser obrigatório
No schema zod do `CreateRoleModal.tsx`, `setor` está como `z.string().optional()`. Deve ser `z.string().min(1, "Selecione um setor")` (obrigatório). Remover o texto "(opcional)" do placeholder e da descrição.

**Arquivo**: `CreateRoleModal.tsx`

### Problema 3: Modal sem estilo dark/glassmorphism
O `DialogContent` do `CreateRoleModal` não tem as classes dark do padrão da página (ex: `bg-black/90 backdrop-blur-xl border-white/10`). Os inputs, labels e textos também precisam de classes de cor adequadas (`text-white`, `bg-white/10`, etc.) para combinar com o restante da interface.

Mesmo ajuste no `EditRoleModal`.

**Arquivos**: `CreateRoleModal.tsx`, `EditRoleModal.tsx`

### Resumo de mudanças

| Arquivo | Mudança |
|---|---|
| `CreateRoleModal.tsx` | Setor obrigatório no schema; dark styling no dialog e inputs |
| `EditRoleModal.tsx` | Dark styling no dialog e inputs |
| `GestaoColaboradoresDirecao.tsx` | `rolesForSetor` usa union de `SETOR_ROLES` + `systemRoles` por setor |
| `VagasPage.tsx` | Mesma lógica de union para roles por setor |

