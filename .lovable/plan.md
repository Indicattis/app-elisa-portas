

## Plano: Corrigir exclusão de itens de missão

### Problema raiz
A política RLS de DELETE na tabela `missao_checkboxes` só permite exclusão pelo **criador da missão** (`missoes.created_by = auth.uid()`). Se um diretor/administrador que não criou a missão tenta excluir um item, o Supabase retorna sucesso (sem erro), mas nenhuma linha é deletada. A invalidação da query traz os dados do servidor de volta, e o item "reaparece".

### Solução

**Migration SQL**: Atualizar a política RLS de DELETE para permitir que diretores e administradores também possam excluir itens de checkbox:

```sql
DROP POLICY "Creator can delete missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can delete missao_checkboxes"
ON public.missao_checkboxes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
    AND missoes.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'diretor')
  OR public.has_role(auth.uid(), 'administrador')
);
```

**Nenhuma alteração no frontend** — o código já está correto (`handleDeleteCheckbox` chama `onDeletarCheckbox` e remove do estado local com `deletedIds`). O problema é 100% na camada de permissão do banco.

### Resultado
Diretores e administradores poderão excluir itens de qualquer missão. Criadores continuam podendo excluir itens das próprias missões.

