

## Plano: Corrigir política RLS de INSERT em `missao_checkboxes`

### Problema
A política de INSERT atual exige que `missoes.created_by = auth.uid()`, ou seja, só o criador da missão pode adicionar itens. Qualquer outro usuário (diretores, administradores) recebe 403 Forbidden.

### Correção — Migration SQL

Dropar a política existente e criar uma nova mais permissiva, alinhada com a política de DELETE que já permite criadores, diretores e administradores:

```sql
DROP POLICY "Authenticated users can insert missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can insert missao_checkboxes"
ON public.missao_checkboxes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
      AND missoes.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'diretor')
  OR has_role(auth.uid(), 'administrador')
);
```

### Arquivo alterado
- Migration SQL (1 arquivo)

