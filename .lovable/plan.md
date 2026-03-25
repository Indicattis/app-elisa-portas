

## Plano: Corrigir policy RLS de INSERT em `missao_checkboxes`

### Problema
Existem duas versões da função `has_role`:
- `has_role(uuid, text)` → consulta `admin_users` (onde o usuário tem `gerente_marketing`)
- `has_role(uuid, user_role)` → consulta `user_roles` (onde o usuário tem `administrador`)

A policy atual usa `has_role(auth.uid(), 'diretor')` que resolve para a versão `text` → `admin_users`, onde o papel é diferente. Por isso o INSERT falha.

### Correção — Migration SQL

Recriar a policy usando a versão correta da função (cast para `user_role`) OU verificar diretamente na tabela `user_roles`:

```sql
DROP POLICY IF EXISTS "Creator or admin can insert missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can insert missao_checkboxes"
ON public.missao_checkboxes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
      AND missoes.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'diretor'::user_role)
  OR has_role(auth.uid(), 'administrador'::user_role)
);
```

Isso força o Postgres a usar o overload que consulta `user_roles`, onde o usuário de fato tem o papel `administrador`.

### Arquivo alterado
- Migration SQL (1 arquivo)

