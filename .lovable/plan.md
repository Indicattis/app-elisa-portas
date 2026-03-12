

## Plano: Corrigir setor não encontrado ao preencher vaga

### Problema
O `PreencherVagaPage` usa `getSetorFromRole()` que depende de um mapeamento hardcoded (`SETOR_ROLES` em `setorMapping.ts`). Roles criados dinamicamente (como `social_media`, `designer`) não estão nesse mapeamento, resultando em setor vazio.

### Solução
Alterar `PreencherVagaPage.tsx` para buscar o setor diretamente da tabela `system_roles` em vez de usar o mapeamento estático.

**Arquivo**: `src/pages/administrativo/rh-dp/PreencherVagaPage.tsx`

Na função `fetchVaga`, após obter o cargo da vaga, buscar o setor na tabela `system_roles`:

```typescript
const { data: roleData } = await supabase
  .from("system_roles")
  .select("setor")
  .eq("key", cargo)
  .single();

setVagaCargo(cargo);
setVagaSetor(roleData?.setor || getSetorFromRole(cargo as any) || "");
```

Isso usa `system_roles` como fonte primária e mantém o mapeamento estático como fallback.

